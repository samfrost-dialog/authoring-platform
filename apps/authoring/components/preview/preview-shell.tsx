'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PreviewBlockRenderer from './preview-block-renderer'

type Course = { id: string; title: string; description: string | null; status: string }
type Lesson = { id: string; course_id: string; title: string; position: number; is_section_header: boolean; created_at: string }
type Block  = { id: string; lesson_id: string; type: string; position: number; content: Record<string, unknown>; settings: Record<string, unknown>; created_at: string }
type Theme  = { primary_color?: string | null; secondary_color?: string | null; accent_color?: string | null; background_color?: string | null; text_color?: string | null; heading_font?: string | null; body_font?: string | null } | null

interface Props {
  course: Course
  lessons: Lesson[]
  blocks: Block[]
  activeLessonId: string | null
  themeCSS?: string
  theme?: Theme
}

export default function PreviewShell({ course, lessons, blocks, activeLessonId: initialLessonId, themeCSS, theme }: Props) {
  const router = useRouter()
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId)

  const primary    = theme?.primary_color    || '#4F46E5'
  const accent     = theme?.accent_color     || '#06B6D4'
  const bg         = theme?.background_color || '#FFFFFF'
  const text       = theme?.text_color       || '#111827'
  const headingFont = theme?.heading_font    || 'Inter'
  const bodyFont   = theme?.body_font        || 'Inter'

  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? lessons[0] ?? null
  const activeBlocks = blocks
    .filter((b) => b.lesson_id === activeLesson?.id)
    .sort((a, b) => a.position - b.position)

  const activeIndex  = lessons.findIndex((l) => l.id === activeLesson?.id)
  const prevLesson   = activeIndex > 0 ? lessons[activeIndex - 1] : null
  const nextLesson   = activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null
  const progressPct  = lessons.length > 0 ? ((activeIndex + 1) / lessons.length) * 100 : 0

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg, color: text, fontFamily: `'${bodyFont}', sans-serif` }}>
      {/* Inject theme CSS */}
      {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}

      {/* Preview banner */}
      <div className="bg-indigo-600 text-white text-xs px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
          <span>Preview mode — this is how learners will see your course</span>
        </div>
        <button onClick={() => router.push(`/editor/${course.id}`)}
          className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1 rounded transition-colors">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 2L3 6l6 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to editor
        </button>
      </div>

      {/* Course header — themed */}
      <div className="flex-shrink-0 px-6 py-8" style={{ background: `linear-gradient(135deg, ${primary} 0%, ${theme?.secondary_color || '#7C3AED'} 100%)` }}>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold text-white mb-1" style={{ fontFamily: `'${headingFont}', sans-serif` }}>
            {course.title}
          </h1>
          {course.description && <p className="text-white/80 text-sm">{course.description}</p>}
          <div className="mt-4 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%`, backgroundColor: accent }} />
          </div>
          <p className="text-white/60 text-xs mt-1">{activeIndex + 1} of {lessons.length} lessons</p>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — themed */}
        <div className="w-56 border-r overflow-y-auto flex-shrink-0" style={{ backgroundColor: bg, borderColor: `${text}15` }}>
          <div className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: `${text}60` }}>Contents</p>
            <nav className="space-y-0.5">
              {lessons.map((lesson, i) => {
                const isActive = lesson.id === activeLesson?.id
                const isPast   = i < activeIndex
                return (
                  <button key={lesson.id} onClick={() => setActiveLessonId(lesson.id)}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                    style={{
                      backgroundColor: isActive ? `${primary}15` : 'transparent',
                      color: isActive ? primary : `${text}99`,
                    }}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs"
                      style={{
                        backgroundColor: isActive ? primary : isPast ? '#22c55e' : `${text}20`,
                        color: (isActive || isPast) ? '#fff' : `${text}80`,
                      }}>
                      {isPast ? (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ) : <span>{i + 1}</span>}
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
                <h2 className="text-2xl font-bold mb-8" style={{ color: text, fontFamily: `'${headingFont}', sans-serif` }}>
                  {activeLesson.title}
                </h2>

                {activeBlocks.length === 0 ? (
                  <div className="text-center py-16" style={{ color: `${text}40` }}>
                    <p className="text-sm">This lesson has no content yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {activeBlocks.map((block) => (
                      <PreviewBlockRenderer key={block.id} block={block} theme={{ primary, accent, text, bg, headingFont, bodyFont }} courseId={course.id} />
                    ))}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-12 pt-8" style={{ borderTop: `1px solid ${text}15` }}>
                  <div>
                    {prevLesson && (
                      <button onClick={() => setActiveLessonId(prevLesson.id)}
                        className="flex items-center gap-2 text-sm transition-colors"
                        style={{ color: `${text}60` }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = text)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = `${text}60`)}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {prevLesson.title}
                      </button>
                    )}
                  </div>
                  <div>
                    {nextLesson ? (
                      <button onClick={() => setActiveLessonId(nextLesson.id)}
                        className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg transition-opacity hover:opacity-90"
                        style={{ backgroundColor: primary, color: '#fff', borderRadius: theme?.heading_font ? undefined : '0.5rem' }}>
                        Next: {nextLesson.title}
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M6 3l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded-lg"
                        style={{ backgroundColor: '#22c55e', color: '#fff' }}>
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
              <div className="text-center py-16" style={{ color: `${text}40` }}>
                <p className="text-sm">No lessons found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}