import Link from 'next/link'
import type { Database } from '@authoring/block-schema/database.types'

type Course = Database['public']['Tables']['courses']['Row']

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-[#2A2A2E] text-[#888]',
  published: 'bg-emerald-500/15 text-emerald-400',
  archived:  'bg-[#2A2A2E] text-[#555]',
}

function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/editor/${course.id}`} className="group block">
      <div className="bg-[#141416] border border-[#1E1E22] rounded-xl overflow-hidden hover:border-[#2E2E36] transition-colors">
        {/* Cover */}
        <div className="h-36 bg-gradient-to-br from-indigo-500/20 via-[#141416] to-purple-500/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 16 16" fill="none" className="opacity-20">
            <rect x="2" y="2" width="5" height="5" rx="1" fill="white"/>
            <rect x="9" y="2" width="5" height="5" rx="1" fill="white"/>
            <rect x="2" y="9" width="5" height="5" rx="1" fill="white"/>
            <rect x="9" y="9" width="5" height="5" rx="1" fill="white"/>
          </svg>
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-white text-sm font-medium leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
              {course.title}
            </h3>
            <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[course.status]}`}>
              {course.status}
            </span>
          </div>
          {course.description && (
            <p className="text-[#555] text-xs line-clamp-2 mt-1">{course.description}</p>
          )}
          <p className="text-[#444] text-xs mt-3">
            {new Date(course.updated_at).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric'
            })}
          </p>
        </div>
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[#141416] border border-[#1E1E22] flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="2" width="5" height="5" rx="1" stroke="#444" strokeWidth="1.5"/>
          <rect x="9" y="2" width="5" height="5" rx="1" stroke="#444" strokeWidth="1.5"/>
          <rect x="2" y="9" width="5" height="5" rx="1" stroke="#444" strokeWidth="1.5"/>
          <rect x="9" y="9" width="5" height="5" rx="1" stroke="#444" strokeWidth="1.5"/>
        </svg>
      </div>
      <h3 className="text-white font-medium mb-1">No courses yet</h3>
      <p className="text-[#555] text-sm">Create your first course to get started</p>
    </div>
  )
}

export default function CourseGrid({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return <EmptyState />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  )
}
