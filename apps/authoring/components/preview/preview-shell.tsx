'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PreviewBlockRenderer from './preview-block-renderer'

type Course = { id: string; title: string; description: string | null; status: string }
type Lesson = { id: string; course_id: string; title: string; position: number; is_section_header: boolean; created_at: string }
type Block  = { id: string; lesson_id: string; type: string; position: number; content: Record<string, unknown>; settings: Record<string, unknown>; created_at: string }
type Theme  = { primary_color?: string | null; secondary_color?: string | null; accent_color?: string | null; background_color?: string | null; text_color?: string | null; heading_font?: string | null; body_font?: string | null; button_style?: { borderRadius?: string; padding?: string; shadow?: boolean } | null } | null

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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const primary      = theme?.primary_color    || '#2563EB'
  const secondary    = theme?.secondary_color  || '#1D4ED8'
  const accent       = theme?.accent_color     || '#3B82F6'
  const bg           = theme?.background_color || '#FFFFFF'
  const text         = theme?.text_color       || '#111827'
  const headingFont  = theme?.heading_font     || 'Inter'
  const bodyFont     = theme?.body_font        || 'Inter'
  const btnRadius    = theme?.button_style?.borderRadius || '0.5rem'

  const scos = lessons.filter((l) => !l.is_section_header)
  const activeLesson = scos.find((l) => l.id === activeLessonId) ?? scos[0] ?? null
  const activeBlocks = blocks
    .filter((b) => b.lesson_id === activeLesson?.id)
    .sort((a, b) => a.position - b.position)
  const activeIndex  = scos.findIndex((l) => l.id === activeLesson?.id)
  const prevLesson   = activeIndex > 0 ? scos[activeIndex - 1] : null
  const nextLesson   = activeIndex < scos.length - 1 ? scos[activeIndex + 1] : null
  const progressPct  = scos.length > 0 ? ((activeIndex + 1) / scos.length) * 100 : 0

  const googleFonts = [...new Set([headingFont, bodyFont])]
    .filter((f) => f && !f.startsWith('fonts/'))
    .map((f) => `family=${f!.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg, color: text, fontFamily: `'${bodyFont}', system-ui, sans-serif` }}>
      {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}
      {googleFonts && <style>{`@import url('https://fonts.googleapis.com/css2?${googleFonts}&display=swap');`}</style>}

      {/* Preview banner */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 text-xs text-white z-50" style={{ backgroundColor: '#1e1b4b' }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="opacity-80">Preview mode</span>
        </div>
        <button onClick={() => router.push(`/editor/${course.id}`)}
          className="flex items-center gap-1.5 opacity-70 hover:opacity-100 transition-opacity">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 2L3 6l6 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to editor
        </button>
      </div>

      {/* Top nav bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b z-40"
        style={{ backgroundColor: bg, borderColor: `${text}15` }}>
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex flex-col gap-1 p-1.5 rounded hover:bg-black/5 transition-colors flex-shrink-0 md:hidden">
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: text }} />
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: text }} />
            <div className="w-3 h-0.5 rounded" style={{ backgroundColor: text }} />
          </button>
          <h1 className="text-sm font-semibold truncate" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
            {course.title}
          </h1>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${text}15` }}>
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, backgroundColor: primary }} />
            </div>
            <span className="text-xs" style={{ color: `${text}60` }}>{activeIndex + 1}/{scos.length}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 md:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`
          fixed md:relative inset-y-0 left-0 z-40 md:z-auto
          w-72 md:w-64 flex-shrink-0 flex flex-col border-r overflow-y-auto
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `} style={{ backgroundColor: bg, borderColor: `${text}12`, top: 0 }}>
          <div className="p-5 border-b flex-shrink-0" style={{ borderColor: `${text}10` }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: `${text}50` }}>Contents</p>
          </div>
          <nav className="flex-1 p-3 space-y-0.5">
            {scos.map((lesson, i) => {
              const isActive = lesson.id === activeLesson?.id
              const isPast   = i < activeIndex
              return (
                <button key={lesson.id}
                  onClick={() => { setActiveLessonId(lesson.id); setSidebarOpen(false) }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all text-sm"
                  style={{
                    backgroundColor: isActive ? `${primary}12` : 'transparent',
                    color: isActive ? primary : `${text}80`,
                  }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                    style={{
                      backgroundColor: isActive ? primary : isPast ? '#10b981' : `${text}12`,
                      color: (isActive || isPast) ? '#fff' : `${text}60`,
                    }}>
                    {isPast
                      ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : i + 1
                    }
                  </div>
                  <span className="leading-snug truncate" style={{ fontWeight: isActive ? 500 : 400 }}>{lesson.title}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 md:px-12 py-10 pb-32">

            {activeLesson ? (
              <>
                {/* Lesson header */}
                <div className="mb-10">
                  <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: primary }}>
                    Lesson {activeIndex + 1} of {scos.length}
                  </p>
                  <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                    {activeLesson.title}
                  </h2>
                  <div className="mt-4 h-px" style={{ backgroundColor: `${text}10` }} />
                </div>

                {/* Blocks */}
                {activeBlocks.length === 0 ? (
                  <div className="text-center py-20" style={{ color: `${text}30` }}>
                    <p className="text-sm">This lesson has no content yet.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {activeBlocks.map((block) => (
                      <PreviewBlockRenderer
                        key={block.id}
                        block={block}
                        theme={{ primary, accent, text, bg, headingFont, bodyFont, btnRadius }}
                        courseId={course.id}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20" style={{ color: `${text}30` }}>
                <p>No lessons found.</p>
              </div>
            )}
          </div>

          {/* Sticky bottom nav */}
          <div className="fixed bottom-0 left-0 right-0 z-20 border-t px-6 py-4 flex items-center justify-between"
            style={{ backgroundColor: bg, borderColor: `${text}12` }}>
            <div>
              {prevLesson && (
                <button onClick={() => setActiveLessonId(prevLesson.id)}
                  className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70"
                  style={{ color: `${text}60` }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="hidden sm:inline">{prevLesson.title}</span>
                  <span className="sm:hidden">Previous</span>
                </button>
              )}
            </div>

            <div className="sm:hidden flex items-center gap-1">
              {scos.map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full transition-all"
                  style={{ backgroundColor: i === activeIndex ? primary : `${text}20` }} />
              ))}
            </div>

            <div>
              {nextLesson ? (
                <button onClick={() => setActiveLessonId(nextLesson.id)}
                  className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg transition-opacity hover:opacity-90 text-white"
                  style={{ backgroundColor: primary, borderRadius: btnRadius }}>
                  <span className="hidden sm:inline">Next: {nextLesson.title}</span>
                  <span className="sm:hidden">Next</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 2l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg text-white"
                  style={{ backgroundColor: '#10b981', borderRadius: btnRadius }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 3.5L12 3.5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Complete
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}