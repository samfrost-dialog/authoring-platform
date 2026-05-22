'use client'

import type { Theme } from './theme-types'

interface Props {
  theme: Partial<Theme>
}

export default function ThemePreview({ theme }: Props) {
  const primary = theme.primary_color || '#4F46E5'
  const secondary = theme.secondary_color || '#7C3AED'
  const accent = theme.accent_color || '#06B6D4'
  const bg = theme.background_color || '#FFFFFF'
  const text = theme.text_color || '#111827'
  const headingFont = theme.heading_font || 'Inter'
  const bodyFont = theme.body_font || 'Inter'
  const btnRadius = theme.button_style?.borderRadius || '0.375rem'
  const btnPadding = theme.button_style?.padding || 'regular'
  const btnShadow = theme.button_style?.shadow || false

  const btnPy = btnPadding === 'compact' ? '6px' : btnPadding === 'large' ? '14px' : '10px'
  const btnPx = btnPadding === 'compact' ? '14px' : btnPadding === 'large' ? '28px' : '20px'

  // Google Fonts import
  const fontsToLoad = [...new Set([headingFont, bodyFont])]
    .map((f) => f.replace(/ /g, '+'))
    .join('&family=')

  return (
    <div className="h-full overflow-y-auto" style={{ backgroundColor: bg, color: text, fontFamily: `'${bodyFont}', sans-serif` }}>
      {/* Load Google Fonts dynamically */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <style>{`@import url('https://fonts.googleapis.com/css2?family=${fontsToLoad}:wght@400;500;600;700&display=swap');`}</style>

      {/* Course header */}
      <div style={{
        background: theme.cover_style === 'solid'
          ? primary
          : `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        padding: '32px 24px',
      }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', fontFamily: `'${bodyFont}', sans-serif` }}>
          COURSE
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: 0, fontFamily: `'${headingFont}', sans-serif` }}>
          Sample Course Title
        </h1>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '6px', fontFamily: `'${bodyFont}', sans-serif` }}>
          A brief description of what learners will achieve
        </p>

        {/* Progress bar */}
        <div style={{ marginTop: '16px', height: '4px', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: '40%', height: '100%', backgroundColor: accent, borderRadius: '2px' }} />
        </div>
        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>2 of 5 lessons complete</p>
      </div>

      {/* Content area */}
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>

        {/* Lesson title */}
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: text, marginBottom: '16px', fontFamily: `'${headingFont}', sans-serif` }}>
          Introduction to the Topic
        </h2>

        {/* Text block */}
        <p style={{ fontSize: '13px', lineHeight: 1.6, color: text, marginBottom: '16px', fontFamily: `'${bodyFont}', sans-serif` }}>
          This is a sample text block showing how your body copy will look with the selected font and colour settings.
          The quick brown fox jumps over the lazy dog.
        </p>

        {/* Callout block */}
        <div style={{
          display: 'flex',
          gap: '12px',
          backgroundColor: `${primary}15`,
          borderLeft: `4px solid ${primary}`,
          borderRadius: '0 8px 8px 0',
          padding: '12px 16px',
          marginBottom: '16px',
        }}>
          <span style={{ fontSize: '16px' }}>💡</span>
          <p style={{ fontSize: '12px', color: text, margin: 0, fontFamily: `'${bodyFont}', sans-serif` }}>
            This is how callout blocks will appear in your course.
          </p>
        </div>

        {/* Quote */}
        <blockquote style={{
          borderLeft: `4px solid ${accent}`,
          paddingLeft: '16px',
          margin: '0 0 16px 0',
        }}>
          <p style={{ fontSize: '13px', fontStyle: 'italic', color: text, margin: '0 0 4px', fontFamily: `'${bodyFont}', sans-serif` }}>
            &ldquo;Great design is making something memorable and meaningful.&rdquo;
          </p>
          <cite style={{ fontSize: '11px', color: `${text}99`, fontFamily: `'${bodyFont}', sans-serif` }}>— Sample Author</cite>
        </blockquote>

        {/* Accordion preview */}
        <div style={{ border: `1px solid ${text}20`, borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
          {['Topic 1', 'Topic 2', 'Topic 3'].map((item, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px 16px',
              borderBottom: i < 2 ? `1px solid ${text}10` : 'none',
              backgroundColor: i === 0 ? `${primary}08` : 'transparent',
            }}>
              <span style={{ fontSize: '12px', fontWeight: i === 0 ? 500 : 400, color: i === 0 ? primary : text, fontFamily: `'${bodyFont}', sans-serif` }}>
                {item}
              </span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d={i === 0 ? 'M9 7L6 4l-3 3' : 'M3 5l3 3 3-3'} stroke={i === 0 ? primary : `${text}60`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button style={{
            backgroundColor: primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: btnRadius,
            padding: `${btnPy} ${btnPx}`,
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: `'${bodyFont}', sans-serif`,
            boxShadow: btnShadow ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
          }}>
            Primary button
          </button>
          <button style={{
            backgroundColor: 'transparent',
            color: primary,
            border: `2px solid ${primary}`,
            borderRadius: btnRadius,
            padding: `${btnPy} ${btnPx}`,
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: `'${bodyFont}', sans-serif`,
          }}>
            Outline button
          </button>
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '16px', borderTop: `1px solid ${text}15` }}>
          <button style={{
            backgroundColor: primary,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: btnRadius,
            padding: `${btnPy} ${btnPx}`,
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: `'${bodyFont}', sans-serif`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            Next lesson
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}