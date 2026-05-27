import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/db/server'
import { parseScormPackage } from '@/lib/scorm/import/parser'
import { fetchBuffer, deleteObject, importStagingKey, uploadBuffer, mediaKey } from '@/lib/r2/client'
import type { RiseMetadata } from '@/lib/scorm/import/parser'
import JSZip from 'jszip'

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

    // Extract Rise CSS bundle for faithful rendering
    let riseCssKey: string | null = null
    try {
      const zip = await JSZip.loadAsync(buffer)
      // Find the largest CSS file — that's Rise's main stylesheet
      // Find largest Rise CSS file by reading each one
      const cssFiles = Object.entries(zip.files)
        .filter(([p]) => p.includes('lib/rise') && p.endsWith('.css'))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .sort(([,a], [,b]) => ((b as any)._data?.uncompressedSize || 0) - ((a as any)._data?.uncompressedSize || 0))

      if (cssFiles.length > 0) {
        const [cssPath, cssFile] = cssFiles[0]
        const cssData = Buffer.from(await (cssFile as JSZip.JSZipObject).async('arraybuffer'))
        const cssR2Key = `rise-css/${orgUser.org_id}/rise-blocks.css`
        await uploadBuffer(cssR2Key, cssData, 'text/css')
        riseCssKey = cssR2Key
      }
    } catch { /* CSS extraction failed, continue */ }

    const { courseTitle, lessons, warnings, riseMetadata } = await parseScormPackage(buffer)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = await createAdminClient() as any

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
          metadata: {
            importedFrom: 'scorm',
            importedAt: new Date().toISOString(),
            riseMetadata,
            riseCssKey,
          },
        })
        .select().single()
      if (courseError) throw courseError
      course = data
    }

    let positionOffset = 0
    if (mode === 'into_course' && targetCourseId) {
      const { data: existingLessons } = await adminSupabase
        .from('lessons').select('position').eq('course_id', course.id)
        .order('position', { ascending: false }).limit(1)
      positionOffset = existingLessons?.[0]?.position != null ? existingLessons[0].position + 1 : 0
    }

    const publicDomain = process.env.R2_PUBLIC_DOMAIN || ''

    for (const lesson of lessons) {
      const { data: lessonRow, error: lessonError } = await adminSupabase
        .from('lessons')
        .insert({
          course_id: course.id,
          title: lesson.title,
          position: lesson.position + positionOffset,
          is_section_header: false,
        })
        .select().single()

      if (lessonError) { warnings.push(`Failed to create lesson: ${lessonError.message}`); continue }

      // Upload media files and build keyMap
      const keyMap: Record<string, string> = {}
      for (const media of lesson.mediaFiles || []) {
        try {
          const r2Key = mediaKey(orgUser.org_id, course.id, media.key.split('/').pop()!)
          await uploadBuffer(r2Key, media.data, media.contentType)
          keyMap[media.key] = `${publicDomain}/${r2Key}`
        } catch { warnings.push(`Failed to upload media: ${media.key}`) }
      }

      // Rewrite block content URLs recursively
      function rewriteContent(c: Record<string, unknown>): Record<string, unknown> {
        const out = { ...c }
        if (out.src && typeof out.src === 'string' && keyMap[out.src]) {
          out.publicUrl = keyMap[out.src]; out.src = out.publicUrl
        }
        if (out.poster && typeof out.poster === 'string' && keyMap[out.poster]) {
          out.posterPublicUrl = keyMap[out.poster]
        }
        if (Array.isArray(out.columns)) {
          out.columns = (out.columns as Array<{ widthPct: number; blocks: Array<{ type: string; content: Record<string, unknown>; settings: Record<string, unknown> }> }>).map((col) => ({
            ...col,
            blocks: (col.blocks || []).map((b) => ({ ...b, content: rewriteContent(b.content) })),
          }))
        }
        return out
      }

      const blocks = lesson.blocks.map((block) => ({
        ...block,
        content: rewriteContent(block.content as Record<string, unknown>),
      }))

      if (blocks.length > 0) {
        const { error: blocksError } = await adminSupabase
          .from('blocks')
          .insert(blocks.map((b) => ({
            lesson_id: lessonRow.id,
            type: b.type,
            position: b.position,
            content: b.content,
            settings: b.settings,
          })))
        if (blocksError) warnings.push(`Failed to insert blocks: ${blocksError.message}`)
      }
    }

    await deleteObject(stagingKey).catch(() => {})

    return NextResponse.json({
      courseId: course.id,
      courseTitle,
      lessonCount: lessons.length,
      blockCount: lessons.reduce((sum, l) => sum + l.blocks.length, 0),
      warnings,
      riseMetadata,
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