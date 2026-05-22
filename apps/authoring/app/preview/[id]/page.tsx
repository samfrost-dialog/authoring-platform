import { notFound, redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/server'
import PreviewShell from '@/components/preview/preview-shell'
import { buildThemeCSS } from '@/lib/scorm/theme-resolver'

export default async function PreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ lesson?: string }>
}) {
  const { id } = await params
  const { lesson: lessonParam } = await searchParams

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: course } = await supabase
    .from('courses').select('*').eq('id', id).is('deleted_at', null).single()
  if (!course) notFound()

  // Fetch theme — course theme overrides org theme
  let theme = null
  if (course.theme_id) {
    const { data } = await supabase.from('themes').select('*').eq('id', course.theme_id).single()
    theme = data
  }
  if (!theme) {
    const { data: orgUser } = await supabase
      .from('org_users').select('org_id').eq('user_id', session.user.id).single()
    if (orgUser) {
      const { data: org } = await supabase
        .from('organisations').select('theme_id').eq('id', orgUser.org_id).single()
      if (org?.theme_id) {
        const { data } = await supabase.from('themes').select('*').eq('id', org.theme_id).single()
        theme = data
      }
    }
  }

  const { data: lessons } = await supabase
    .from('lessons').select('*').eq('course_id', id).order('position', { ascending: true })

  const lessonIds = (lessons ?? []).map((l: { id: string }) => l.id)
  const { data: blocks } = lessonIds.length
    ? await supabase.from('blocks').select('*').in('lesson_id', lessonIds).order('position', { ascending: true })
    : { data: [] }

  const activeLessonId = lessonParam ?? lessons?.[0]?.id ?? null
  const themeCSS = theme ? buildThemeCSS(theme) : ''

  return (
    <PreviewShell
      course={course}
      lessons={lessons ?? []}
      blocks={blocks ?? []}
      activeLessonId={activeLessonId}
      themeCSS={themeCSS}
      theme={theme}
    />
  )
}