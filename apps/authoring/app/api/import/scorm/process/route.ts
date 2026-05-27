import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/db/server'
import { fetchBuffer, deleteObject, importStagingKey, uploadBuffer } from '@/lib/r2/client'
import JSZip from 'jszip'
import { parse as parseHtml } from 'node-html-parser'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users').select('org_id, role').eq('user_id', session.user.id).single()
  if (!orgUser || !['org_admin', 'author'].includes(orgUser.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { sessionId, mode = 'standalone', targetCourseId } = await request.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const stagingKey = importStagingKey(sessionId)

  try {
    const buffer = await fetchBuffer(stagingKey)
    const zip = await JSZip.loadAsync(buffer)
    const warnings: string[] = []

    // ── Read manifest to get course title and lessons ─────────────────────
    const manifestFile = zip.file('imsmanifest.xml')
    if (!manifestFile) throw new Error('No imsmanifest.xml found')

    const manifestXml = await manifestFile.async('string')
    const manifest = parseHtml(manifestXml, { lowerCaseTagName: true })

    const orgTitle = manifest.querySelector('organization > title')
    const courseTitle = orgTitle?.text?.trim() || 'Imported Course'
    const items = manifest.querySelectorAll('item[identifierref]')

    // ── Upload ALL ZIP files to R2 under scorm-content/{courseId}/ ────────
    // We store the entire scormcontent folder so we can serve it faithfully
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = await createAdminClient() as any

    // Create course first so we have the ID for R2 paths
    let course
    if (mode === 'into_course' && targetCourseId) {
      const { data } = await adminSupabase.from('courses').select('*').eq('id', targetCourseId).single()
      course = data
    } else {
      const { data, error: courseError } = await adminSupabase
        .from('courses')
        .insert({
          title: courseTitle,
          org_id: orgUser.org_id,
          created_by: session.user.id,
          status: 'draft',
          metadata: { importedFrom: 'scorm', importedAt: new Date().toISOString(), preservedOriginal: true },
        })
        .select().single()
      if (courseError) throw courseError
      course = data
    }

    // Upload every file from the ZIP to R2 under scorm-content/{courseId}/
    const r2Prefix = `scorm-content/${course.id}`
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || ''
    let uploadedCount = 0

    for (const [path, file] of Object.entries(zip.files)) {
      if (file.dir) continue
      try {
        const fileData = Buffer.from(await file.async('arraybuffer'))
        const r2Key = `${r2Prefix}/${path}`
        const contentType = guessContentType(path)
        await uploadBuffer(r2Key, fileData, contentType)
        uploadedCount++
      } catch {
        warnings.push(`Failed to upload: ${path}`)
      }
    }

    // ── Create one lesson per SCO item ────────────────────────────────────
    // Find existing lesson count for positioning
    let positionOffset = 0
    if (mode === 'into_course' && targetCourseId) {
      const { data: existingLessons } = await adminSupabase
        .from('lessons').select('position').eq('course_id', course.id)
        .order('position', { ascending: false }).limit(1)
      positionOffset = existingLessons?.[0]?.position != null ? existingLessons[0].position + 1 : 0
    }

    let lessonCount = 0
    let blockCount = 0

    if (items.length === 0) {
      // Single lesson from whole package
      const { data: lessonRow } = await adminSupabase
        .from('lessons')
        .insert({ course_id: course.id, title: courseTitle, position: positionOffset, is_section_header: false })
        .select().single()

      if (lessonRow) {
        // Find the main launch file
        const launchHref = findLaunchFile(zip)
        await adminSupabase.from('blocks').insert({
          lesson_id: lessonRow.id,
          type: 'raw_scorm',
          position: 0,
          content: {
            baseUrl: `${publicDomain}/${r2Prefix}/`,
            launchFile: launchHref,
            courseTitle,
          },
          settings: {},
        })
        lessonCount = 1
        blockCount = 1
      }
    } else {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const itemTitle = item.querySelector('title')?.text?.trim() || `Lesson ${i + 1}`
        const identifierRef = item.getAttribute('identifierref') || ''
        const resource = manifest.querySelector(`resource[identifier="${identifierRef}"]`)
        const href = resource?.getAttribute('href') || ''

        const { data: lessonRow } = await adminSupabase
          .from('lessons')
          .insert({
            course_id: course.id,
            title: itemTitle,
            position: i + positionOffset,
            is_section_header: false,
          })
          .select().single()

        if (lessonRow && href) {
          await adminSupabase.from('blocks').insert({
            lesson_id: lessonRow.id,
            type: 'raw_scorm',
            position: 0,
            content: {
              baseUrl: `${publicDomain}/${r2Prefix}/`,
              launchFile: href,
              courseTitle,
              itemTitle,
            },
            settings: {},
          })
          blockCount++
        }
        lessonCount++
      }
    }

    await deleteObject(stagingKey).catch(() => {})

    return NextResponse.json({
      courseId: course.id,
      courseTitle,
      lessonCount,
      blockCount,
      uploadedFiles: uploadedCount,
      warnings,
    })

  } catch (err) {
    console.error('SCORM process error:', err)
    await deleteObject(stagingKey).catch(() => {})
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    )
  }
}

function findLaunchFile(zip: JSZip): string {
  const htmlFiles = Object.keys(zip.files).filter((f) =>
    (f.endsWith('.html') || f.endsWith('.htm')) && !zip.files[f].dir
  )
  // Prefer index.html at root or in scormcontent/
  const preferred = htmlFiles.find((f) => f === 'index.html' || f === 'scormcontent/index.html')
  return preferred || htmlFiles[0] || 'index.html'
}

function guessContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    html: 'text/html', htm: 'text/html',
    js: 'application/javascript', css: 'text/css',
    json: 'application/json', xml: 'application/xml',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
    gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
    mp4: 'video/mp4', webm: 'video/webm', mp3: 'audio/mpeg',
    woff: 'font/woff', woff2: 'font/woff2', ttf: 'font/ttf',
    pdf: 'application/pdf', zip: 'application/zip',
  }
  return map[ext] || 'application/octet-stream'
}