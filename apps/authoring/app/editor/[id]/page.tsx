import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/server'
import EditorShell from '@/components/editor/editor-shell'

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerClient()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: course } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (!course) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select('*')
    .eq('course_id', id)
    .order('position', { ascending: true })

  const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id)
  const { data: blocks } = lessonIds.length
    ? await supabase
        .from('blocks')
        .select('*')
        .in('lesson_id', lessonIds)
        .order('position', { ascending: true })
    : { data: [] }

  return (
    <EditorShell
      course={course}
      initialLessons={lessons ?? []}
      initialBlocks={blocks ?? []}
    />
  )
}
