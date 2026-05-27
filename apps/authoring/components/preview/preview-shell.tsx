'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PreviewBlockRenderer from './preview-block-renderer'

type Course = { id: string; title: string; description: string | null; status: string; metadata?: Record<string, unknown> }
type Lesson = { id: string; course_id: string; title: string; position: number; is_section_header: boolean; created_at: string }
type Block  = { id: string; lesson_id: string; type: string; position: number; content: Record<string, unknown>; settings: Record<string, unknown>; created_at: string }
type Theme  = { primary_color?: string | null; secondary_color?: string | null; accent_color?: string | null; background_color?: string | null; text_color?: string | null; heading_font?: string | null; body_font?: string | null; button_style?: { borderRadius?: string; padding?: string; shadow?: boolean } | null } | null

interface RiseMetadata {
  accentColor: string
  bodyTypeface: string
  headingTypeface: string
  uiTypeface: string
  blockCorners: string
}

interface Props {
  course: Course
  lessons: Lesson[]
  blocks: Block[]
  activeLessonId: string | null
  themeCSS?: string
  theme?: Theme
}

function buildRiseCssVars(meta: RiseMetadata): string {
  const accent = meta.accentColor || '#0076ce'
  const h = accent.replace('#', '')
  const r = parseInt(h.slice(0,2), 16)
  const g = parseInt(h.slice(2,4), 16)
  const b = parseInt(h.slice(4,6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const contrast = lum < 0.5 ? '#ffffff' : '#000000'
  const contrastRgb = lum < 0.5 ? '255, 255, 255' : '0, 0, 0'
  const tr = Math.round(r + (255-r)*0.85)
  const tg = Math.round(g + (255-g)*0.85)
  const tb = Math.round(b + (255-b)*0.85)
  const tint = `#${tr.toString(16).padStart(2,'0')}${tg.toString(16).padStart(2,'0')}${tb.toString(16).padStart(2,'0')}`

  return `
    :root {
      --color-theme: ${accent};
      --color-theme-rgb: ${r}, ${g}, ${b};
      --color-theme-contrast: ${contrast};
      --color-theme-contrast-rgb: ${contrastRgb};
      --color-theme-tint: ${tint};
      --color-theme-transparent: rgba(${r}, ${g}, ${b}, 0);
      --color-theme-contrast-complementary: ${contrast};
      --color-theme-contrast-complementary-rgb: ${contrastRgb};
      --font-family-body: '${meta.bodyTypeface}', 'Noto Sans Myanmar', sans-serif;
      --font-family-head: '${meta.headingTypeface}', 'Noto Sans Myanmar', sans-serif;
      --font-family-ui: '${meta.uiTypeface}', 'Noto Sans Myanmar', sans-serif;
      --mon-theme-font-body: var(--font-family-body);
      --mon-theme-font-heading: var(--font-family-head);
      --dir-x: 1; --dir-start: left; --dir-end: right;
      --color-border-decorative: rgba(0,0,0,0.15);
      --color-text: #1f2937;
      --color-background: #ffffff;
    }
    .bg--type-black { --color-text: #ffffff; --color-border-decorative: rgba(255,255,255,0.3); background-color: #000000; }
    .bg--type-dark  { --color-text: #ffffff; background-color: #1a1a1a; }
    .bg--type-accent { --color-text: ${contrast}; background-color: ${accent}; }
    .bg--type-color { --color-text: #ffffff; }
    .bg--type-light { background-color: #ffffff; --color-text: #1f2937; }
  `
}

export default function PreviewShell({ course, lessons, blocks, activeLessonId: initialLessonId, theme }: Props) {
  const router = useRouter()
  const [activeLessonId, setActiveLessonId] = useState(initialLessonId)
  const [riseCss, setRiseCss] = useState<string>('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Extract Rise metadata from course
  const riseMetadata = (course.metadata?.riseMetadata as RiseMetadata | undefined)
  const riseCssKey   = course.metadata?.riseCssKey as string | undefined
  const publicDomain = process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN || ''

  // Determine if this is a Rise-imported course
  const isRiseCourse = !!riseMetadata

  // Load Rise CSS if available
  useEffect(() => {
    if (!riseCssKey || !publicDomain) return
    fetch(`${publicDomain}/${riseCssKey}`)
      .then((r) => r.text())
      .then(setRiseCss)
      .catch(() => {})
  }, [riseCssKey, publicDomain])

  const primary     = riseMetadata?.accentColor || theme?.primary_color || '#0076ce'
  const bg          = theme?.background_color || '#FFFFFF'
  const text        = theme?.text_color || '#111827'
  const bodyFont    = riseMetadata?.bodyTypeface || theme?.body_font || 'Inter'
  const headingFont = riseMetadata?.headingTypeface || theme?.heading_font || 'Inter'

  const scos = lessons.filter((l) => !l.is_section_header)
  const activeLesson  = scos.find((l) => l.id === activeLessonId) ?? scos[0] ?? null
  const activeBlocks  = blocks.filter((b) => b.lesson_id === activeLesson?.id).sort((a, b) => a.position - b.position)
  const activeIndex   = scos.findIndex((l) => l.id === activeLesson?.id)
  const prevLesson    = activeIndex > 0 ? scos[activeIndex - 1] : null
  const nextLesson    = activeIndex < scos.length - 1 ? scos[activeIndex + 1] : null
  const progressPct   = scos.length > 0 ? ((activeIndex + 1) / scos.length) * 100 : 0

  const googleFonts = [...new Set([bodyFont, headingFont, riseMetadata?.uiTypeface].filter(Boolean))]
    .filter((f) => f && !f.startsWith('fonts/'))
    .map((f) => `family=${f!.replace(/ /g, '+')}:wght@400;500;600;700`)
    .join('&')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: bg, color: text, fontFamily: `'${bodyFont}', sans-serif` }}>
      {/* Inject Rise CSS + theme variables */}
      {googleFonts && <style>{`@import url('https://fonts.googleapis.com/css2?${googleFonts}&display=swap');`}</style>}
      {riseMetadata && <style>{buildRiseCssVars(riseMetadata)}</style>}
      {riseCss && <style>{riseCss}</style>}

      {/* Rise content: set 10px base so rem values match Rise's design system */}
      {isRiseCourse && <style>{`
        .rise-lesson-content { font-size: 10px; }
        .rise-lesson-content * { box-sizing: border-box; }
        .rise-lesson-content table { width: 100%; border-collapse: collapse; }
        .rise-lesson-content th { background-color: var(--color-theme, #0076ce); color: #fff; padding: 17px 15px; font-weight: 700; text-align: left; border: 1px solid rgba(255,255,255,0.2); font-size: 1.4rem; }
        .rise-lesson-content td { padding: 17px 15px; border: 1px solid #ddd; font-size: 1.4rem; vertical-align: middle; }
        .rise-lesson-content tr:nth-child(even) td { background-color: #f5f5f5; }
        .rise-lesson-content .rise-table-wrap { overflow-x: auto; }
        .rise-lesson-content a { color: var(--color-theme, #0076ce); }
        .rise-lesson-content p { margin-block-end: 1.7rem; }
        .rise-lesson-content p:last-child { margin-block-end: 0; }
      `}</style>}

      {/* Preview banner */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 text-xs text-white z-50" style={{ backgroundColor: '#1e1b4b', fontSize: '13px' }}>
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

      {/* Course nav header */}
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
        <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
          <div className="w-32 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: `${text}15` }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%`, backgroundColor: primary }} />
          </div>
          <span className="text-xs" style={{ color: `${text}60` }}>{activeIndex + 1}/{scos.length}</span>
        </div>
      </div>

      <div className="flex flex-1 relative" style={{ minHeight: 0 }}>
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 md:hidden" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <div className={`fixed md:relative inset-y-0 left-0 z-40 md:z-auto w-72 md:w-64 flex-shrink-0 flex flex-col border-r overflow-y-auto transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
          style={{ backgroundColor: bg, borderColor: `${text}12`, top: 0 }}>
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
                  style={{ backgroundColor: isActive ? `${primary}12` : 'transparent', color: isActive ? primary : `${text}80` }}>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                    style={{ backgroundColor: isActive ? primary : isPast ? '#10b981' : `${text}12`, color: (isActive || isPast) ? '#fff' : `${text}60` }}>
                    {isPast
                      ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : i + 1}
                  </div>
                  <span className="leading-snug truncate" style={{ fontWeight: isActive ? 500 : 400 }}>{lesson.title}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1" style={{ overflowY: "auto", minHeight: 0 }}>
          {/* For Rise courses: blocks are full-width sections, no max-width container */}
          {isRiseCourse ? (
            <div style={{ paddingBottom: "120px" }}>
              {activeLesson && (
                <>
                  {/* Rise lesson header */}
                  <div className="px-8 py-8 border-b" style={{ borderColor: `${text}10` }}>
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: primary }}>
                      Lesson {activeIndex + 1} of {scos.length}
                    </p>
                    <h2 className="text-3xl font-bold" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                      {activeLesson.title}
                    </h2>
                  </div>

                  {activeBlocks.length === 0 ? (
                    <div className="text-center py-20" style={{ color: `${text}30` }}>
                      <p className="text-sm">This lesson has no content yet.</p>
                    </div>
                  ) : (
                    // Rise blocks: no spacing between — each block manages its own padding
                    <div className="rise-lesson-content">
                      {activeBlocks.map((block) => (
                        <PreviewBlockRenderer
                          key={block.id}
                          block={block}
                          theme={{ primary, accent: primary, text, bg, headingFont, bodyFont, btnRadius: '0.375rem' }}
                          courseId={course.id}
                          isRiseCourse={isRiseCourse}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-8 md:px-16 py-10 pb-32">
              {activeLesson && (
                <>
                  <div className="mb-10">
                    <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: primary }}>
                      Lesson {activeIndex + 1} of {scos.length}
                    </p>
                    <h2 className="text-3xl font-bold leading-tight" style={{ fontFamily: `'${headingFont}', sans-serif`, color: text }}>
                      {activeLesson.title}
                    </h2>
                    <div className="mt-4 h-px" style={{ backgroundColor: `${text}10` }} />
                  </div>
                  {activeBlocks.length === 0 ? (
                    <div className="text-center py-20" style={{ color: `${text}30` }}>
                      <p className="text-sm">This lesson has no content yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {activeBlocks.map((block) => (
                        <PreviewBlockRenderer key={block.id} block={block}
                          theme={{ primary, accent: primary, text, bg, headingFont, bodyFont, btnRadius: '0.375rem' }}
                          courseId={course.id} isRiseCourse={false} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Sticky nav */}
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
            <div>
              {nextLesson ? (
                <button onClick={() => setActiveLessonId(nextLesson.id)}
                  className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg transition-opacity hover:opacity-90 text-white"
                  style={{ backgroundColor: primary, borderRadius: '0.5rem' }}>
                  <span className="hidden sm:inline">Next: {nextLesson.title}</span>
                  <span className="sm:hidden">Next</span>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M5 2l5 5-5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold px-6 py-2.5 rounded-lg text-white"
                  style={{ backgroundColor: '#10b981', borderRadius: '0.5rem' }}>
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