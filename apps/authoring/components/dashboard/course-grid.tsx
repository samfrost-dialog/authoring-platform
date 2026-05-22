'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Course {
  id: string
  title: string
  description: string | null
  status: string
  updated_at: string
}

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-[#2A2A2E] text-[#888]',
  published: 'bg-emerald-500/15 text-emerald-400',
  archived:  'bg-[#2A2A2E] text-[#555]',
}

function CourseCard({ course, onDelete }: { course: Course; onDelete: (id: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return
    setDeleting(true)
    setMenuOpen(false)
    try {
      const res = await fetch(`/api/courses/${course.id}`, { method: 'DELETE' })
      if (res.ok) onDelete(course.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="relative group">
      <Link href={`/editor/${course.id}`} className="block">
        <div className={`bg-[#141416] border border-[#1E1E22] rounded-xl overflow-hidden hover:border-[#2E2E36] transition-colors ${deleting ? 'opacity-40 pointer-events-none' : ''}`}>
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
              <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[course.status] || STATUS_STYLES.draft}`}>
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

      {/* Actions menu */}
      <div className="absolute top-2 right-2 z-10">
        <div className="relative">
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen(!menuOpen) }}
            className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="2.5" r="1" fill="white"/>
              <circle cx="6.5" cy="6.5" r="1" fill="white"/>
              <circle cx="6.5" cy="10.5" r="1" fill="white"/>
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); setMenuOpen(false) }} />
              <div className="absolute right-0 top-8 z-20 bg-[#1A1A1C] border border-[#2A2A2E] rounded-xl shadow-2xl py-1 w-44 overflow-hidden">
                <Link href={`/editor/${course.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#ccc] hover:bg-white/5 transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5l2 2-6 6H2.5v-2l6-6z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Edit course
                </Link>
                <Link href={`/preview/${course.id}`}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#ccc] hover:bg-white/5 transition-colors"
                  onClick={() => setMenuOpen(false)}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z" stroke="currentColor" strokeWidth="1.2"/>
                    <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  Preview
                </Link>
                <div className="h-px bg-[#2A2A2E] mx-2 my-1" />
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 3h8M5 3V2h2v1M3.5 3l.5 7h4l.5-7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Delete course
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
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

export default function CourseGrid({ courses: initialCourses }: { courses: Course[] }) {
  const router = useRouter()
  const [courses, setCourses] = useState(initialCourses)

  function handleDelete(id: string) {
    setCourses((prev) => prev.filter((c) => c.id !== id))
    router.refresh()
  }

  if (courses.length === 0) return <EmptyState />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} onDelete={handleDelete} />
      ))}
    </div>
  )
}