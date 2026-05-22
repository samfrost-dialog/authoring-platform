'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Course, Lesson, Block } from '@/components/editor/types'
import PreviewBlockRenderer from './preview-block-renderer'

interface Props {
  course: Course
  lessons: Lesson[]
  blocks: Block[]
  activeLessonId: string | null
}

export default function PreviewShell({ course, lessons, blocks, activeLessonId: initialLessonId }: Props) {
  const router = useRouter()
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId)

  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? lessons[0] ?? null
  const activeBlocks = blocks
    .filter((b) => b.lesson_id === activeLesson?.id)
    .sort((a, b) => a.position - b.position)

  const activeIndex = lessons.findIndex((l) => l.id === activeLesson?.id)
  const prevLesson = activeIndex > 0 ? lessons[activeIndex - 1] : null
  const nextLesson = activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null

  const completedCount = activeIndex + 1
  const progressPct = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Preview banner */}
      <div className="bg-indigo-600 text-white text-xs px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
          <span>Preview mode — this is how learners will see your course</span>
        </div>
        <button
          onClick={() => router.push(`/editor/${course.id}`)}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 2L3 6l6 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to editor
        </button>
      </div>

      {/* Course header */}
      <div className="bg-gray-900 text-white px-6 py-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-lg font-semibold">{course.title}</h1>
          {course.description && (
            <p className="text-gray-400 text-sm mt-0.5">{course.description}</p>
          )}
          {/* Progress bar */}
          <div className="mt-3 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-400 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs mt-1">{completedCount} of {lessons.length} lessons</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — lesson nav */}
        <div className="w-56 bg-gray-50 border-r border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Contents</p>
            <nav className="space-y-0.5">
              {lessons.map((lesson, i) => {
                const isActive = lesson.id === activeLesson?.id
                const isPast = i < activeIndex
                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLessonId(lesson.id)}
                    className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                      isActive ? 'bg-indigo-600 text-white' :
                      isPast ? 'bg-green-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {isPast ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <span className="truncate">{lesson.title}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-10">
            {activeLesson ? (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-8">{activeLesson.title}</h2>

                {activeBlocks.length === 0 ? (
                  <div className="text-center py-16 text-gray-400">
                    <p className="text-sm">This lesson has no content yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeBlocks.map((block) => (
                      <PreviewBlockRenderer key={block.id} block={block} />
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-200">
                  <div>
                    {prevLesson && (
                      <button
                        onClick={() => setActiveLessonId(prevLesson.id)}
                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {prevLesson.title}
                      </button>
                    )}
                  </div>
                  <div>
                    {nextLesson ? (
                      <button
                        onClick={() => setActiveLessonId(nextLesson.id)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-colors"
                      >
                        Next: {nextLesson.title}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 3l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 bg-green-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Course complete
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-16 text-gray-400">
                <p className="text-sm">No lessons found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}