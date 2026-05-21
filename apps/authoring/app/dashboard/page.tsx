import { createServerClient } from '@/lib/db/server'
import CourseGrid from '@/components/dashboard/course-grid'
import NewCourseButton from '@/components/dashboard/new-course-button'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Courses</h1>
          <p className="text-[#666] text-sm mt-0.5">
            {courses?.length ?? 0} course{courses?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <NewCourseButton />
      </div>

      {/* Course grid */}
      {error ? (
        <div className="text-red-400 text-sm">Failed to load courses.</div>
      ) : (
        <CourseGrid courses={courses ?? []} />
      )}
    </div>
  )
}
