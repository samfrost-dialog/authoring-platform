'use client'

import { useState } from 'react'

type BlockTheme = {
  primary: string; accent: string; text: string; bg: string
  headingFont: string; bodyFont: string; btnRadius?: string
}

type Block = {
  id: string; lesson_id: string; type: string; position: number
  content: Record<string, unknown>; settings: Record<string, unknown>; created_at: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = Record<string, any>

interface Props {
  block: Block
  theme?: BlockTheme
  courseId?: string
  isRiseCourse?: boolean
}

function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.92)' }} onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white z-10" onClick={onClose}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M6 6l16 16M22 6L6 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain' }}
        onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

export default function PreviewBlockRenderer({ block, theme, courseId, isRiseCourse }: Props) {
  const c: C = block.content || {}
  const t = theme ?? { primary: '#0076ce', accent: '#0076ce', text: '#111827', bg: '#ffffff', headingFont: 'Roboto', bodyFont: 'Roboto' }

  if (isRiseCourse) {
    return <RiseBlock block={block} c={c} t={t} />
  }
  return <NativeBlock block={block} c={c} t={t} courseId={courseId} />
}

// ── Rise-faithful renderer ────────────────────────────────────────────────────
// Matches Rise's visual output using inline styles that replicate Rise's CSS

function RiseBlock({ block, c, t }: { block: Block; c: C; t: BlockTheme }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  const bgType  = c.bgClass as string || ''
  const bgColor = c.bgColor as string | undefined
  const ptRem   = ((c.paddingTop    as number) ?? 3) * 0.5
  const pbRem   = ((c.paddingBottom as number) ?? 3) * 0.5

  // Section background
  const sectionBg =
    bgType === 'bg--type-black'  ? '#000000' :
    bgType === 'bg--type-dark'   ? '#1a1a1a' :
    bgType === 'bg--type-accent' ? t.primary :
    bgType === 'bg--type-color' && bgColor ? bgColor :
    'transparent'

  const sectionTextColor =
    sectionBg === 'transparent' || sectionBg === '#ffffff' ? '#1f2937' :
    sectionBg === t.primary ? '#ffffff' :
    '#ffffff'

  const sectionStyle: React.CSSProperties = {
    backgroundColor: sectionBg === 'transparent' ? undefined : sectionBg,
    color: sectionTextColor,
    paddingTop: `${ptRem * 10}px`,
    paddingBottom: `${pbRem * 10}px`,
    fontFamily: `'${t.bodyFont}', sans-serif`,
  }

  // Max-width content container (Rise uses ~1020px max-width, 30px padding)
  const innerStyle: React.CSSProperties = {
    maxWidth: '1020px',
    margin: '0 auto',
    paddingLeft: '30px',
    paddingRight: '30px',
  }

  switch (block.type) {

    // ── Video ──────────────────────────────────────────────────────────────
    case 'video': {
      const vidUrl    = c.publicUrl || c.src
      const posterUrl = c.posterPublicUrl || c.poster
      if (!vidUrl) return null
      return (
        // Rise video: no horizontal padding, full container width
        <div style={{ ...sectionStyle, paddingLeft: 0, paddingRight: 0 }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <video
              src={String(vidUrl)}
              poster={posterUrl ? String(posterUrl) : undefined}
              controls
              style={{ width: '100%', display: 'block', maxHeight: '620px', objectFit: 'contain', backgroundColor: '#000' }}
            />
          </div>
        </div>
      )
    }

    // ── Text ───────────────────────────────────────────────────────────────
    case 'text': {
      const html      = c.html as string || ''
      const variant   = c.riseVariant as string || ''
      const textWidth = (c.textWidth as number) ?? 92
      const isHeading = variant.includes('heading') || variant.includes('subheading')

      // Strip Rise editor wrapper divs, preserve inner HTML with inline styles
      const cleanHtml = stripEditorDivs(html)

      return (
        <div style={sectionStyle}>
          <div style={innerStyle}>
            <div style={{ maxWidth: `${textWidth}%`, margin: '0 auto' }}>
              {isHeading ? (
                <div style={{
                  fontFamily: `'${t.headingFont}', sans-serif`,
                  fontSize: '2.8rem',
                  fontWeight: 700,
                  lineHeight: 1.25,
                  color: sectionTextColor,
                }} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
              ) : (
                <div style={{
                  fontFamily: `'${t.bodyFont}', sans-serif`,
                  fontSize: '1.7rem',
                  lineHeight: 1.94,
                  color: sectionTextColor,
                }} dangerouslySetInnerHTML={{ __html: cleanHtml }} />
              )}
            </div>
          </div>
        </div>
      )
    }

    // ── Image ──────────────────────────────────────────────────────────────
    case 'image': {
      const imgUrl    = c.publicUrl || c.src
      const caption   = c.caption   as string || ''
      const paragraph = c.paragraph as string || ''
      const variant   = c.riseVariant as string || ''
      const zoomable  = !!c.zoomOnClick
      const overlayOpacity = parseFloat(String(c.overlayOpacity ?? 0.1))
      const overlayColor   = c.overlayColor as string || '#000000'

      if (!imgUrl) return null

      // text overlay: full-width image, text overlaid on left side
      if (variant === 'text overlay') {
        const cleanCaption = stripEditorDivs(caption)
        return (
          <>
            {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
            <div style={{ ...sectionStyle, padding: 0, position: 'relative', overflow: 'hidden' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={String(imgUrl)} alt=""
                style={{ width: '100%', display: 'block', cursor: zoomable ? 'zoom-in' : 'default' }}
                onClick={() => zoomable && setLightbox(String(imgUrl))} />
              {overlayOpacity > 0 && (
                <div style={{ position: 'absolute', inset: 0, backgroundColor: overlayColor, opacity: overlayOpacity, pointerEvents: 'none' }} />
              )}
              {cleanCaption && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center',
                  padding: '3rem',
                  maxWidth: '50%',
                }}>
                  <div style={{ color: '#fff' }} dangerouslySetInnerHTML={{ __html: cleanCaption }} />
                </div>
              )}
            </div>
          </>
        )
      }

      // hero: full-width image, caption below with section bg
      if (variant === 'hero') {
        const cleanCaption = stripEditorDivs(caption)
        return (
          <>
            {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
            <div style={sectionStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={String(imgUrl)} alt=""
                style={{ width: '100%', display: 'block', cursor: zoomable ? 'zoom-in' : 'default' }}
                onClick={() => zoomable && setLightbox(String(imgUrl))} />
              {cleanCaption && (
                <div style={{
                  ...innerStyle,
                  paddingTop: '1.5rem',
                  paddingBottom: '0.5rem',
                  fontSize: '1.2rem',
                  color: sectionTextColor,
                  borderBottom: `1px solid ${sectionTextColor === '#ffffff' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)'}`,
                }} dangerouslySetInnerHTML={{ __html: cleanCaption }} />
              )}
            </div>
          </>
        )
      }

      // text aside: image left (~50%), text right (~50%)
      if (variant === 'text aside') {
        const cleanParagraph = stripEditorDivs(paragraph)
        const cleanCaption   = stripEditorDivs(caption)
        const captionText    = cleanCaption.replace(/<[^>]*>/g, '').trim()
        return (
          <>
            {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
            <div style={sectionStyle}>
              <div style={{ ...innerStyle, display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
                <div style={{ flex: '0 0 calc(50% - 1.5rem)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={String(imgUrl)} alt=""
                    style={{ width: '100%', display: 'block', cursor: zoomable ? 'zoom-in' : 'default' }}
                    onClick={() => zoomable && setLightbox(String(imgUrl))} />
                  {captionText && captionText !== 'Click on image to zoom in.' && (
                    <p style={{ fontSize: '1.2rem', color: sectionTextColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : '#6b7280', marginTop: '0.75rem' }}>
                      {captionText}
                    </p>
                  )}
                </div>
                <div style={{ flex: '1', color: sectionTextColor }} dangerouslySetInnerHTML={{ __html: cleanParagraph }} />
              </div>
            </div>
          </>
        )
      }

      // standard image
      const cleanCaption = stripEditorDivs(caption)
      return (
        <>
          {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
          <div style={sectionStyle}>
            <div style={innerStyle}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={String(imgUrl)} alt=""
                style={{ width: '100%', display: 'block', cursor: zoomable ? 'zoom-in' : 'default' }}
                onClick={() => zoomable && setLightbox(String(imgUrl))} />
              {cleanCaption && (
                <div style={{ fontSize: '1.2rem', color: '#6b7280', marginTop: '0.75rem', textAlign: 'center' }}
                  dangerouslySetInnerHTML={{ __html: cleanCaption }} />
              )}
            </div>
          </div>
        </>
      )
    }

    // ── Accordion ──────────────────────────────────────────────────────────
    case 'accordion': {
      const items = (c.items as Array<{ id: string; title: string; bodyHtml: string }>) || []
      return (
        <div style={sectionStyle}>
          <div style={innerStyle}>
            {items.map((item) => (
              <details key={item.id} style={{ borderBottom: `1px solid ${sectionTextColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : '#e5e7eb'}` }}>
                <summary style={{ cursor: 'pointer', padding: '1.5rem 0', fontSize: '1.7rem', fontWeight: 600, listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span dangerouslySetInnerHTML={{ __html: stripEditorDivs(item.title) }} />
                  <span style={{ marginLeft: '1rem', fontSize: '1.2rem' }}>▾</span>
                </summary>
                <div style={{ padding: '0 0 1.5rem', fontSize: '1.7rem', lineHeight: 1.7 }}
                  dangerouslySetInnerHTML={{ __html: stripEditorDivs(item.bodyHtml) }} />
              </details>
            ))}
          </div>
        </div>
      )
    }

    case 'raw_scorm':
      return (
        <iframe src={`${c.baseUrl}${c.launchFile}`} className="w-full border-0"
          style={{ height: '100vh', minHeight: '600px' }} title={String(c.itemTitle || '')} />
      )

    default:
      return <NativeBlock block={block} c={c} t={t} />
  }
}

// ── Strip Rise's editor wrapper divs ─────────────────────────────────────────
// Removes <div data-editor-id="..."> wrappers but preserves all inner HTML
// including inline styles like font-size, color, text-align

function stripEditorDivs(html: string): string {
  if (!html) return ''
  return html
    .replace(/<div[^>]*data-editor-id="[^"]*"[^>]*>/gi, '')
    .replace(/<div[^>]*class="rise-table-wrap"[^>]*>/gi, '<div class="rise-table-wrap" style="overflow-x:auto">')
    .replace(/<\/div>(?=\s*$)/gi, '')  // only remove trailing close divs
    .trim()
}

// ── Native block renderer ─────────────────────────────────────────────────────

function NativeBlock({ block, c, t, courseId }: { block: Block; c: C; t: BlockTheme; courseId?: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  switch (block.type) {
    case 'text':
      if (!c.html) return null
      return (
        <div style={{ color: t.text, fontFamily: `'${t.bodyFont}', sans-serif`, lineHeight: 1.6 }}
          dangerouslySetInnerHTML={{ __html: c.html }} />
      )

    case 'image': {
      const imgUrl = c.publicUrl || c.src
      if (!imgUrl) return <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">No image</div>
      const caption = c.caption ? String(c.caption).replace(/<[^>]*>/g, '').trim() : ''
      return (
        <>
          {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
          <figure className="mx-auto max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(imgUrl)} alt={String(c.alt || '')} className="w-full rounded-xl shadow-sm block"
              style={{ cursor: c.zoomOnClick ? 'zoom-in' : 'default' }}
              onClick={() => c.zoomOnClick && setLightbox(String(imgUrl))} />
            {caption && <figcaption className="text-sm mt-2 text-center" style={{ color: `${t.text}60` }}>{caption}</figcaption>}
          </figure>
        </>
      )
    }

    case 'video': {
      const vidUrl = c.publicUrl || c.src
      const posterUrl = c.posterPublicUrl || c.poster
      if (!vidUrl) return <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">No video</div>
      return <video src={String(vidUrl)} poster={posterUrl ? String(posterUrl) : undefined} controls className="w-full rounded-xl block" />
    }

    case 'quote':
      return (
        <blockquote className="border-l-4 pl-5 py-1" style={{ borderColor: t.accent }}>
          <div dangerouslySetInnerHTML={{ __html: String(c.text || '') }} />
        </blockquote>
      )

    case 'callout':
      return (
        <div className="flex gap-3 rounded-lg p-4 border-l-4"
          style={{ backgroundColor: `${t.primary}15`, borderColor: t.primary }}>
          <span className="text-xl flex-shrink-0">{String(c.icon || '💡')}</span>
          <div dangerouslySetInnerHTML={{ __html: String(c.html || '') }} />
        </div>
      )

    case 'divider':
      return <hr style={{ borderStyle: String(c.style || 'solid'), borderColor: String(c.color || '#E5E7EB'), borderTopWidth: `${c.thickness || 1}px` }} />

    case 'spacer':
      return <div style={{ height: `${c.height || 40}px` }} />

    case 'accordion': {
      const items = (c.items as Array<{ id: string; title: string; bodyHtml: string }>) || []
      return (
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {items.map((item) => (
            <details key={item.id} className="group">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 list-none">
                <span className="font-medium" dangerouslySetInnerHTML={{ __html: item.title }} />
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </summary>
              <div className="px-5 py-4 border-t border-gray-100" dangerouslySetInnerHTML={{ __html: item.bodyHtml || '' }} />
            </details>
          ))}
        </div>
      )
    }

    case 'tabs': {
      return <TabsBlock items={(c.items as Array<{ id: string; label: string; bodyHtml: string }>) || []} primary={t.primary} />
    }

    case 'button': {
      const align = c.alignment as string || 'left'
      return (
        <div style={{ display: 'flex', justifyContent: align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start' }}>
          <a href={String(c.url || '#')} target={c.openInNewTab ? '_blank' : undefined} rel="noopener noreferrer"
            className="inline-flex items-center text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: t.primary, borderRadius: t.btnRadius || '0.375rem', padding: '0.625rem 1.25rem' }}>
            {String(c.label || 'Button')}
          </a>
        </div>
      )
    }

    case 'columns': {
      const cols = (c.columns as Array<{ widthPct: number; blocks: Array<{ type: string; content: C; settings: C }> }>) || []
      return (
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {cols.map((col, i) => (
            <div key={i} style={{ flex: `0 0 calc(${col.widthPct}% - 0.75rem)`, minWidth: '200px' }}>
              {(col.blocks || []).map((b, j) => (
                <NativeBlock key={j}
                  block={{ id: `col-${i}-${j}`, lesson_id: '', type: b.type, position: j, content: b.content, settings: b.settings, created_at: '' }}
                  c={b.content} t={t} courseId={courseId} />
              ))}
            </div>
          ))}
        </div>
      )
    }

    case 'quiz':
    case 'knowledge_check':
      return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm">Quiz — configure in editor</p>
        </div>
      )

    case 'statement':
      return (
        <div className="text-center py-8 px-6 rounded-xl" style={{ backgroundColor: `${t.primary}10` }}>
          <div dangerouslySetInnerHTML={{ __html: String(c.text || '') }} />
        </div>
      )

    case 'raw_scorm':
      return <iframe src={`${c.baseUrl}${c.launchFile}`} className="w-full border-0" style={{ height: '100vh' }} title="" />

    case 'raw_html':
      return <div dangerouslySetInnerHTML={{ __html: String(c.html || '') }} />

    default:
      return (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-4 py-3 text-center text-gray-400 text-sm">
          {block.type.replace(/_/g, ' ')}
        </div>
      )
  }
}

function TabsBlock({ items, primary }: { items: Array<{ id: string; label: string; bodyHtml: string }>; primary: string }) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const activeItem = items.find((i) => i.id === active)
  if (!items.length) return null
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50">
        {items.map((item) => (
          <button key={item.id} onClick={() => setActive(item.id)}
            className="px-5 py-3 text-sm font-medium transition-colors"
            style={{ color: item.id === active ? primary : '#6b7280', borderBottom: item.id === active ? `2px solid ${primary}` : '2px solid transparent' }}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="p-5" dangerouslySetInnerHTML={{ __html: activeItem?.bodyHtml || '' }} />
    </div>
  )
}