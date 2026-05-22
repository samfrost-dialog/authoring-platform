import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/db/server'
import { parseScormPackage } from '@/lib/scorm/import/parser'
import { fetchBuffer, deleteObject, importStagingKey } from '@/lib/r2/client'

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

  const { sessionId } = await request.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const key = importStagingKey(sessionId)

  try {
    // Fetch the ZIP from R2
    const buffer = await fetchBuffer(key)

    // Parse the SCORM package
    const { courseTitle, lessons, warnings } = await parseScormPackage(buffer)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adminSupabase = await createAdminClient() as any

    const { data: course, error: courseError } = await adminSupabase
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

    for (const lesson of lessons) {
      const { data: lessonRow, error: lessonError } = await adminSupabase
        .from('lessons')
        .insert({
          course_id:         course.id,
          title:             lesson.title,
          position:          lesson.position,
          is_section_header: false,
        })
        .select()
        .single()

      if (lessonError) {
        warnings.push(`Failed to create lesson "${lesson.title}": ${lessonError.message}`)
        continue
      }

      if (lesson.blocks.length > 0) {
        const blockInserts = lesson.blocks.map((block) => ({
          lesson_id: lessonRow.id,
          type:      block.type,
          position:  block.position,
          content:   block.content,
          settings:  block.settings,
        }))

        const { error: blocksError } = await adminSupabase
          .from('blocks').insert(blockInserts)

        if (blocksError) {
          warnings.push(`Failed to insert blocks for "${lesson.title}": ${blocksError.message}`)
        }
      }
    }

    // Clean up staging file
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
    // Clean up on failure
    await deleteObject(key).catch(() => {})
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    )
  }
}