import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/db/server'
import { buildScormPackage } from '@/lib/scorm/export/builder'
import { uploadBuffer, exportKey } from '@/lib/r2/client'
import { getPresignedGetUrl } from '@/lib/r2/client'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminSupabase = await createAdminClient() as any

  try {
    // Fetch course
    const { data: course, error: courseError } = await supabase
      .from('courses').select('*').eq('id', id).is('deleted_at', null).single()
    if (courseError || !course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    // Fetch org slug
    const { data: orgUser } = await supabase
      .from('org_users').select('org_id').eq('user_id', session.user.id).single()
    const { data: org } = orgUser
      ? await supabase.from('organisations').select('slug').eq('id', orgUser.org_id).single()
      : { data: null }
    const orgSlug = org?.slug || 'org'

    // Fetch theme
    let theme = null
    if (course.theme_id) {
      const { data } = await adminSupabase.from('themes').select('*').eq('id', course.theme_id).single()
      theme = data
    }

    // Fetch lessons
    const { data: lessons } = await supabase
      .from('lessons').select('*').eq('course_id', id).order('position', { ascending: true })

    // Fetch blocks
    const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id)
    const { data: blocks } = lessonIds.length
      ? await adminSupabase.from('blocks').select('*').in('lesson_id', lessonIds).order('position', { ascending: true })
      : { data: [] }

    // Determine passing score from first quiz block found
    let passingScore = 80
    for (const block of (blocks ?? [])) {
      if ((block.type === 'quiz' || block.type === 'knowledge_check') && block.content?.passingScore) {
        passingScore = block.content.passingScore
        break
      }
    }

    // Build the SCORM package
    const riseMetadata = course.metadata?.riseMetadata || null

    const zipBuffer = await buildScormPackage({
      course,
      lessons:     lessons ?? [],
      blocks:      blocks ?? [],
      theme,
      orgSlug,
      passingScore,
      riseMetadata,
    })

    // Upload to R2
    const timestamp = Date.now()
    const key = exportKey(course.id, timestamp)
    await uploadBuffer(key, zipBuffer, 'application/zip')

    // Return signed download URL (24hr)
    const downloadUrl = await getPresignedGetUrl(key, 24 * 60 * 60)

    return NextResponse.json({
      downloadUrl,
      filename: `${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_scorm.zip`,
      size: zipBuffer.length,
    })

  } catch (err) {
    console.error('SCORM export error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Export failed' },
      { status: 500 }
    )
  }
}