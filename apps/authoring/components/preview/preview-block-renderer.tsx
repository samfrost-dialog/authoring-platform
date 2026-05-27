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

// ── Lightbox ──────────────────────────────────────────────────────────────────

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

// ── Main renderer ─────────────────────────────────────────────────────────────

export default function PreviewBlockRenderer({ block, theme, courseId, isRiseCourse }: Props) {
  const c: C = block.content || {}
  const t = theme ?? { primary: '#0076ce', accent: '#0076ce', text: '#111827', bg: '#ffffff', headingFont: 'Roboto', bodyFont: 'Roboto' }

  if (isRiseCourse) return <RiseBlock block={block} c={c} t={t} />
  return <NativeBlock block={block} c={c} t={t} courseId={courseId} />
}

// ── Rise-faithful renderer — uses Rise's exact class names and structure ───────

function RiseBlock({ block, c, t }: { block: Block; c: C; t: BlockTheme }) {
  const [lightbox, setLightbox] = useState<string | null>(null)

  // Resolve section wrapper classes and CSS vars exactly as Rise does
  const bgClass = c.bgClass as string || 'bg--type-light'
  const bgColor = c.bgColor as string | undefined

  const wrapperBg =
    bgClass === 'bg--type-black'  ? '#000000' :
    bgClass === 'bg--type-dark'   ? '#1a1a1a' :
    bgClass === 'bg--type-accent' ? t.primary :
    bgClass === 'bg--type-color' && bgColor ? bgColor :
    '#ffffff'

  const contrastColor = wrapperBg === '#ffffff' ? '#000' : '#fff'
  const contrastComplementary = wrapperBg === '#ffffff' ? '#fff' : '#000'

  const rangeClass =
    bgClass === 'bg--type-black'  ? 'bg--range-near-black' :
    bgClass === 'bg--type-accent' ? 'bg--range-med' :
    'bg--range-light'

  const ptRem = ((c.paddingTop    as number) ?? 3) * 0.5
  const pbRem = ((c.paddingBottom as number) ?? 3) * 0.5

  const wrapperStyle: React.CSSProperties = {
    ['--color-background' as string]: wrapperBg,
    ['--color-background-contrast' as string]: contrastColor,
    ['--color-background-contrast-complementary' as string]: contrastComplementary,
    boxShadow: `${wrapperBg} 0px 1px 0px`,
    paddingTop: `${ptRem}rem`,
    paddingBottom: `${pbRem}rem`,
    backgroundColor: wrapperBg,
    color: contrastColor,
    fontFamily: `'${t.bodyFont}', sans-serif`,
  }

  switch (block.type) {

    // ── Video ──────────────────────────────────────────────────────────────
    case 'video': {
      const vidUrl    = c.publicUrl || c.src
      const posterUrl = c.posterPublicUrl || c.poster
      if (!vidUrl) return null

      return (
        <div className={`block-video block-wrapper bg ${rangeClass} ${bgClass}`} style={wrapperStyle}>
          <span></span>
          <div className="block-video__item block-video__item--medium">
            <figure>
              <div className="video-container">
                <video
                  src={String(vidUrl)}
                  poster={posterUrl ? String(posterUrl) : undefined}
                  controls
                  style={{ width: '100%', display: 'block', backgroundColor: '#000' }}
                />
              </div>
              <figcaption className="block-video__wrapper"></figcaption>
            </figure>
          </div>
        </div>
      )
    }

    // ── Text ───────────────────────────────────────────────────────────────
    case 'text': {
      const html = c.html as string || ''
      if (!html.trim()) return null

      return (
        <div className={`block-text block-wrapper bg ${rangeClass} ${bgClass}`} style={wrapperStyle}>
          <span></span>
          <div className="block-text__container">
            <div className="block-text__row"></div>
            <div className="block-text__row">
              <div className="block-text__col brand--linkColor">
                <div className="fr-view rise-tiptap">
                  <div dangerouslySetInnerHTML={{ __html: html }} />
                </div>
              </div>
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

      const figureId = `figcaption-${block.id}`

      // ── text overlay (block-image--overlay) ──────────────────────────────
      if (variant === 'text overlay') {
        return (
          <>
            {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
            <div className={`block-image block-image--overlay block-image--flag-dimensions block-wrapper bg ${rangeClass} ${bgClass}`}
              style={{ ...wrapperStyle, paddingTop: 0, paddingBottom: 0 }}>
              <span></span>
              <div className="block-image__figure">
                <div className="block-image__image"
                  style={{ backgroundImage: `url("${imgUrl}")` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img alt="" decoding="async" loading="lazy" src={String(imgUrl)}
                    style={{ cursor: zoomable ? 'zoom-in' : 'default' }}
                    onClick={() => zoomable && setLightbox(String(imgUrl))} />
                  <div className="block-image__overlay"
                    style={{ opacity: overlayOpacity, backgroundColor: overlayColor }} />
                </div>
                <div className="block-image__container">
                  <div className="block-image__row">
                    <div className="block-image__col">
                      <div className="block-image__paragraph brand--linkColor">
                        <div className="fr-view rise-tiptap">
                          <div dangerouslySetInnerHTML={{ __html: paragraph || caption }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      // ── hero (block-image--hero) ──────────────────────────────────────────
      if (variant === 'hero') {
        return (
          <>
            {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
            <div className={`block-image block-image--hero block-image--flag-dimensions block-wrapper bg ${rangeClass} ${bgClass}`}
              style={wrapperStyle}>
              <span></span>
              <div className="block-image__container">
                <div className="block-image__row">
                  <div className="block-image__col">
                    <figure aria-labelledby={figureId} className="block-image__figure" role="figure">
                      <div className="block-image__image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" className="img-img img-img--center" decoding="async" loading="lazy"
                          src={String(imgUrl)}
                          style={{ width: '100%', display: 'block', cursor: zoomable ? 'zoom-in' : 'default' }}
                          onClick={() => zoomable && setLightbox(String(imgUrl))} />
                      </div>
                      {caption && (
                        <figcaption id={figureId}>
                          <div className="block-image__caption brand--linkColor">
                            <div className="fr-view rise-tiptap">
                              <div dangerouslySetInnerHTML={{ __html: caption }} />
                            </div>
                          </div>
                        </figcaption>
                      )}
                    </figure>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      // ── text aside (block-image--text-aside) ──────────────────────────────
      if (variant === 'text aside') {
        return (
          <>
            {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
            <div className={`block-image block-image--text-aside block-wrapper bg ${rangeClass} ${bgClass}`}
              style={wrapperStyle}>
              <span></span>
              <div className="block-image__container">
                <div className="block-image__row">
                  {/* Image column */}
                  <div className="block-image__col">
                    <figure aria-labelledby={figureId} className="block-image__figure" role="figure">
                      <div className="block-image__image">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="" className="img-img img-img--center" decoding="async" loading="lazy"
                          src={String(imgUrl)}
                          style={{ cursor: zoomable ? 'zoom-in' : 'default' }}
                          onClick={() => zoomable && setLightbox(String(imgUrl))} />
                      </div>
                      {caption && (
                        <figcaption id={figureId}>
                          <div className="block-image__caption brand--linkColor">
                            <div className="fr-view rise-tiptap">
                              <div dangerouslySetInnerHTML={{ __html: caption }} />
                            </div>
                          </div>
                        </figcaption>
                      )}
                    </figure>
                  </div>
                  {/* Text column */}
                  <div className="block-image__col">
                    <div className="block-image__text brand--linkColor">
                      <div className="fr-view rise-tiptap">
                        <div dangerouslySetInnerHTML={{ __html: paragraph }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      // ── standard image ────────────────────────────────────────────────────
      return (
        <>
          {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
          <div className={`block-image block-wrapper bg ${rangeClass} ${bgClass}`} style={wrapperStyle}>
            <span></span>
            <div className="block-image__container">
              <div className="block-image__row">
                <div className="block-image__col">
                  <figure aria-labelledby={figureId} className="block-image__figure" role="figure">
                    <div className="block-image__image">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img alt="" className="img-img img-img--center" decoding="async" loading="lazy"
                        src={String(imgUrl)}
                        style={{ width: '100%', display: 'block', cursor: zoomable ? 'zoom-in' : 'default' }}
                        onClick={() => zoomable && setLightbox(String(imgUrl))} />
                    </div>
                    {caption && (
                      <figcaption id={figureId}>
                        <div className="block-image__caption brand--linkColor">
                          <div className="fr-view rise-tiptap">
                            <div dangerouslySetInnerHTML={{ __html: caption }} />
                          </div>
                        </div>
                      </figcaption>
                    )}
                  </figure>
                </div>
              </div>
            </div>
          </div>
        </>
      )
    }

    // ── Accordion ──────────────────────────────────────────────────────────
    case 'accordion': {
      const items = (c.items as Array<{ id: string; title: string; bodyHtml: string }>) || []
      return (
        <div className={`block-accordion block-wrapper bg ${rangeClass} ${bgClass}`} style={wrapperStyle}>
          <span></span>
          <div className="block-accordion__container">
            {items.map((item) => (
              <details key={item.id} className="block-accordion__item">
                <summary className="block-accordion__title brand--linkColor">
                  <div className="fr-view rise-tiptap" dangerouslySetInnerHTML={{ __html: item.title }} />
                  <span className="block-accordion__icon">▾</span>
                </summary>
                <div className="block-accordion__body brand--linkColor">
                  <div className="fr-view rise-tiptap" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />
                </div>
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
      const size = (c.size as string) || 'large'
      const alignment = (c.alignment as string) || 'center'
      const radius = c.borderRadius !== undefined ? String(c.borderRadius) : '0.75rem'

      const wrapStyle: React.CSSProperties =
        size === 'small'  ? { maxWidth: '240px', marginLeft: alignment === 'right' ? 'auto' : alignment === 'center' ? 'auto' : undefined, marginRight: alignment === 'left' ? undefined : 'auto' } :
        size === 'medium' ? { maxWidth: '480px', marginLeft: alignment === 'center' || alignment === 'right' ? 'auto' : undefined, marginRight: alignment === 'center' || alignment === 'left' ? 'auto' : undefined } :
        size === 'full'   ? { width: '100%' } :
        { maxWidth: '100%', marginLeft: 'auto', marginRight: 'auto' }

      return (
        <>
          {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
          <figure style={wrapStyle}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(imgUrl)} alt={String(c.alt || '')}
              style={{ width: '100%', display: 'block', borderRadius: radius, cursor: c.zoomOnClick ? 'zoom-in' : 'default' }}
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
      if (c.type === 'youtube' || c.type === 'vimeo') {
        const src = c.type === 'youtube' ? String(vidUrl).replace('watch?v=', 'embed/') : String(vidUrl).replace('vimeo.com/', 'player.vimeo.com/video/')
        return <div className="aspect-video rounded-xl overflow-hidden"><iframe src={src} className="w-full h-full" allowFullScreen /></div>
      }
      return <video src={String(vidUrl)} poster={posterUrl ? String(posterUrl) : undefined} controls className="w-full rounded-xl block" />
    }

    case 'audio':
      if (!c.publicUrl) return null
      return <audio src={String(c.publicUrl)} controls className="w-full" />

    case 'quote':
      return (
        <blockquote className="border-l-4 pl-5 py-1" style={{ borderColor: t.accent }}>
          <div dangerouslySetInnerHTML={{ __html: String(c.text || '') }} />
          {c.author && <footer className="text-sm mt-2 not-italic" style={{ color: `${t.text}60` }}>— {String(c.author)}</footer>}
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

    case 'statement':
      return (
        <div className="text-center py-8 px-6 rounded-xl" style={{ backgroundColor: `${t.primary}10` }}>
          <div dangerouslySetInnerHTML={{ __html: String(c.text || '') }} />
        </div>
      )

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