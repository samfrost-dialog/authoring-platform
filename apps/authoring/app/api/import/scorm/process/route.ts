import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/db/server'
import { parseScormPackage } from '@/lib/scorm/import/parser'
import { fetchBuffer, deleteObject, importStagingKey, uploadBuffer, mediaKey } from '@/lib/r2/client'

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

  const key = importStagingKey(sessionId)

  try {
    const buffer = await fetchBuffer(key)
    const { courseTitle, lessons, warnings } = await parseScormPackage(buffer)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = await createAdminClient() as any

    let course
    if (mode === 'into_course' && targetCourseId) {
      // Use existing course
      const { data, error } = await adminSupabase
        .from('courses').select('*').eq('id', targetCourseId).single()
      if (error) throw error
      course = data
    } else {
      // Create new standalone course
      const { data, error: courseError } = await adminSupabase
        .from('courses')
        .insert({
          title:      courseTitle,
          org_id:     orgUser.org_id,
          created_by: session.user.id,
          status:     'draft',
          metadata:   { importedFrom: 'scorm', importedAt: new Date().toISOString() },
        })
        .select()
        .single()
      if (courseError) throw courseError
      course = data
    }

    // Find current max position if appending to existing course
    let positionOffset = 0
    if (mode === 'into_course' && targetCourseId) {
      const { data: existingLessons } = await adminSupabase
        .from('lessons').select('position').eq('course_id', course.id).order('position', { ascending: false }).limit(1)
      positionOffset = existingLessons?.[0]?.position != null ? existingLessons[0].position + 1 : 0
    }

    for (const lesson of lessons) {
      const { data: lessonRow, error: lessonError } = await adminSupabase
        .from('lessons')
        .insert({
          course_id:         course.id,
          title:             lesson.title,
          position:          lesson.position + positionOffset,
          is_section_header: false,
        })
        .select()
        .single()

      if (lessonError) {
        warnings.push(`Failed to create lesson "${lesson.title}": ${lessonError.message}`)
        continue
      }

      // Upload extracted media files to R2 and rewrite block content URLs
      const keyMap: Record<string, string> = {}
      for (const media of lesson.mediaFiles || []) {
        try {
          const r2Key = mediaKey(orgUser.org_id, course.id, media.key.split('/').pop()!)
          await uploadBuffer(r2Key, media.data, media.contentType)
          const publicDomain = process.env.R2_PUBLIC_DOMAIN || ''
          keyMap[media.key] = `${publicDomain}/${r2Key}`
        } catch (e) {
          warnings.push(`Failed to upload media: ${media.key}`)
        }
      }

      // Rewrite block content to use real R2 URLs (including nested blocks inside columns)
      function rewriteContent(c: Record<string, unknown>): Record<string, unknown> {
        const out = { ...c }
        // Rewrite src/publicUrl at this level
        if (out.src && typeof out.src === 'string' && keyMap[out.src]) {
          out.publicUrl = keyMap[out.src]
          out.src = out.publicUrl
        }
        if (out.publicUrl && typeof out.publicUrl === 'string' && keyMap[out.publicUrl]) {
          out.publicUrl = keyMap[out.publicUrl]
          out.src = out.publicUrl
        }
        // Rewrite poster field (video thumbnails)
        if (out.poster && typeof out.poster === 'string' && keyMap[out.poster]) {
          out.posterPublicUrl = keyMap[out.poster]
        }
        // Recurse into columns
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
          .insert(blocks.map((block) => ({
            lesson_id: lessonRow.id,
            type:      block.type,
            position:  block.position,
            content:   block.content,
            settings:  block.settings,
          })))

        if (blocksError) {
          warnings.push(`Failed to insert blocks for "${lesson.title}": ${blocksError.message}`)
        }
      }
    }

    await deleteObject(key).catch(() => {})

    return NextResponse.json({
      courseId:    course.id,
      courseTitle,
      lessonCount: lessons.length,
      blockCount:  lessons.reduce((sum, l) => sum + l.blocks.length, 0),
      warnings,
    })

  } catch (err) {
    console.error('SCORM process error:', err)
    await deleteObject(key).catch(() => {})
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    )
  }
}