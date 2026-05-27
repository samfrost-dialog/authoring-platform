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

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <button className="absolute top-4 right-4 text-white/70 hover:text-white" onClick={onClose}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-w-full max-h-full cursor-zoom-out" onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

// ── ScormIframe ───────────────────────────────────────────────────────────────

function ScormIframe({ baseUrl, launchFile, title }: { baseUrl: string; launchFile: string; title: string }) {
  const launchUrl = baseUrl && launchFile ? `${baseUrl}${launchFile}` : null
  if (!launchUrl) return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
      SCORM content URL not set
    </div>
  )
  return (
    <div style={{ margin: '0' }}>
      <iframe src={launchUrl} className="w-full border-0" style={{ height: '100vh', minHeight: '600px' }}
        allow="fullscreen" title={title} />
    </div>
  )
}

// ── Main renderer ─────────────────────────────────────────────────────────────

export default function PreviewBlockRenderer({ block, theme, courseId, isRiseCourse }: Props) {
  const c: C = block.content || {}
  const t = theme ?? { primary: '#0076ce', accent: '#0076ce', text: '#111827', bg: '#ffffff', headingFont: 'Roboto', bodyFont: 'Roboto' }

  // Rise block section wrapper
  const bgClass   = (c.bgClass as string) || ''
  const bgColor   = c.bgColor as string | undefined
  const ptRem     = ((c.paddingTop as number)    ?? 3) * 0.5
  const pbRem     = ((c.paddingBottom as number) ?? 3) * 0.5

  const sectionStyle: React.CSSProperties = {
    ...(bgColor && bgClass === 'bg--type-color' ? { backgroundColor: bgColor } : {}),
  }

  if (isRiseCourse) {
    return (
      <div className={`${bgClass}`} style={sectionStyle}>
        <RiseBlockContent block={block} c={c} t={t} courseId={courseId} />
      </div>
    )
  }

  return (
    <div>
      <NativeBlockContent block={block} c={c} t={t} courseId={courseId} />
    </div>
  )
}

// ── Rise-faithful block renderer ──────────────────────────────────────────────

function RiseBlockContent({ block, c, t, courseId }: { block: Block; c: C; t: BlockTheme; courseId?: string }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const ptRem = ((c.paddingTop  as number) ?? 3) * 0.5
  const pbRem = ((c.paddingBottom as number) ?? 3) * 0.5
  const textWidth = (c.textWidth as number) ?? 92

  switch (block.type) {
    // ── Text ────────────────────────────────────────────────────────────────
    case 'text': {
      const html = c.html as string || ''
      const variant = c.riseVariant as string || ''
      return (
        <div className="block-text" style={{ paddingBlock: `${ptRem}rem 0` }}>
          <div className="block-text__content" style={{ maxWidth: '102rem', margin: '0 auto', paddingInline: '3rem', paddingBottom: `${pbRem}rem` }}>
            <div style={{ maxWidth: `${textWidth}%`, margin: '0 auto' }}>
              {variant.includes('heading') || variant.includes('subheading') ? (
                <div className="block-text__heading" dangerouslySetInnerHTML={{ __html: html }} />
              ) : (
                <div className="block-text__body" dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          </div>
        </div>
      )
    }

    // ── Video ────────────────────────────────────────────────────────────────
    case 'video': {
      const vidUrl = c.publicUrl || c.src
      const posterUrl = c.posterPublicUrl || c.poster
      if (!vidUrl) return null
      return (
        <div className="block-video" style={{ paddingBlock: `${ptRem}rem ${pbRem}rem` }}>
          <div className="block-video__wrapper">
            <div className="block-video__item block-video__item--medium">
              <figure>
                <div className="block-video__figure-container">
                  <video
                    src={String(vidUrl)}
                    poster={posterUrl ? String(posterUrl) : undefined}
                    controls
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
              </figure>
            </div>
          </div>
        </div>
      )
    }

    // ── Image ─────────────────────────────────────────────────────────────
    case 'image': {
      const imgUrl = c.publicUrl || c.src
      const caption = c.caption as string || ''
      const paragraph = c.paragraph as string || ''
      const riseClass = c.riseBlockClass as string || ''
      const overlayOpacity = parseFloat(String(c.overlayOpacity || 0))
      const overlayColor = c.overlayColor as string || '#000000'
      const zoomOnClick = !!c.zoomOnClick
      const captionText = caption ? caption.replace(/<[^>]*>/g, '').trim() : ''

      if (!imgUrl) return null

      return (
        <>
          {lightboxSrc && <Lightbox src={lightboxSrc} alt="" onClose={() => setLightboxSrc(null)} />}
          <div className={`block-image ${riseClass}`} style={{ paddingBlock: `${ptRem}rem ${pbRem}rem` }}>
            {/* text-aside: image left, text right */}
            {riseClass === 'block-image--text-aside' ? (
              <div style={{ maxWidth: '102rem', margin: '0 auto', paddingInline: '3rem', display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>
                <div style={{ flex: '0 0 50%' }} className="block-image__figure">
                  <div className="block-image__image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={String(imgUrl)} alt=""
                      style={{ width: '100%', display: 'block', cursor: zoomOnClick ? 'zoom-in' : 'default' }}
                      onClick={() => zoomOnClick && setLightboxSrc(String(imgUrl))} />
                  </div>
                  {captionText && captionText !== 'Click on image to zoom in.' && (
                    <div className="block-image__caption" dangerouslySetInnerHTML={{ __html: caption }} />
                  )}
                </div>
                <div style={{ flex: '1' }} className="block-image__text">
                  <div dangerouslySetInnerHTML={{ __html: paragraph }} />
                </div>
              </div>
            ) : riseClass === 'block-image--text-overlay' ? (
              // text-overlay: text over image
              <div style={{ position: 'relative', maxWidth: '102rem', margin: '0 auto' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={String(imgUrl)} alt="" style={{ width: '100%', display: 'block' }} />
                {overlayOpacity > 0 && (
                  <div style={{ position: 'absolute', inset: 0, backgroundColor: overlayColor, opacity: overlayOpacity }} />
                )}
                {caption && (
                  <div className="block-image__text" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '3rem' }}>
                    <div dangerouslySetInnerHTML={{ __html: caption }} />
                  </div>
                )}
              </div>
            ) : riseClass === 'block-image--hero' ? (
              // hero: full width, caption below
              <div>
                <div style={{ position: 'relative' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={String(imgUrl)} alt="" style={{ width: '100%', display: 'block',
                    cursor: zoomOnClick ? 'zoom-in' : 'default' }}
                    onClick={() => zoomOnClick && setLightboxSrc(String(imgUrl))} />
                </div>
                {caption && (
                  <div className="block-image__caption" style={{ maxWidth: '102rem', margin: '0 auto', paddingInline: '8.333%' }}
                    dangerouslySetInnerHTML={{ __html: caption }} />
                )}
              </div>
            ) : (
              // standard image
              <div style={{ maxWidth: '102rem', margin: '0 auto', paddingInline: '3rem' }}>
                <div className="block-image__image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={String(imgUrl)} alt=""
                    style={{ width: '100%', display: 'block', cursor: zoomOnClick ? 'zoom-in' : 'default' }}
                    onClick={() => zoomOnClick && setLightboxSrc(String(imgUrl))} />
                </div>
                {caption && (
                  <div className="block-image__caption" dangerouslySetInnerHTML={{ __html: caption }} />
                )}
              </div>
            )}
          </div>
        </>
      )
    }

    // ── Accordion ────────────────────────────────────────────────────────
    case 'accordion': {
      const items = (c.items as Array<{ id: string; title: string; bodyHtml: string }>) || []
      return (
        <div className="block-accordion" style={{ paddingBlock: `${ptRem}rem ${pbRem}rem` }}>
          <div style={{ maxWidth: '102rem', margin: '0 auto', paddingInline: '3rem' }}>
            {items.map((item) => (
              <details key={item.id}>
                <summary style={{ cursor: 'pointer', padding: '1rem', fontFamily: `'${t.headingFont}', sans-serif`, fontWeight: 600 }}>
                  <span dangerouslySetInnerHTML={{ __html: item.title }} />
                </summary>
                <div style={{ padding: '0 1rem 1rem' }} dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />
              </details>
            ))}
          </div>
        </div>
      )
    }

    case 'raw_scorm':
      return <ScormIframe baseUrl={String(c.baseUrl || '')} launchFile={String(c.launchFile || '')} title={String(c.itemTitle || c.courseTitle || '')} />

    default:
      return <NativeBlockContent block={block} c={c} t={t} courseId={courseId} />
  }
}

// ── Native (non-Rise) block renderer ─────────────────────────────────────────

function NativeBlockContent({ block, c, t, courseId }: { block: Block; c: C; t: BlockTheme; courseId?: string }) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  switch (block.type) {
    case 'text':
      if (!c.html) return null
      return (
        <div className="rise-content max-w-none leading-relaxed"
          style={{ color: t.text, fontFamily: `'${t.bodyFont}', sans-serif` }}
          dangerouslySetInnerHTML={{ __html: c.html }} />
      )

    case 'image': {
      const imgUrl = c.publicUrl || c.src
      if (!imgUrl) return <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">No image</div>
      const caption = c.caption ? String(c.caption).replace(/<[^>]*>/g, '').trim() : ''
      const radius = c.borderRadius !== undefined ? String(c.borderRadius) : '0.75rem'
      return (
        <>
          {lightboxSrc && <Lightbox src={lightboxSrc} alt="" onClose={() => setLightboxSrc(null)} />}
          <figure className="mx-auto max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(imgUrl)} alt={String(c.alt || '')}
              className="w-full shadow-sm hover:opacity-95 transition-opacity"
              style={{ borderRadius: radius, cursor: c.zoomOnClick ? 'zoom-in' : 'default', display: 'block' }}
              onClick={() => c.zoomOnClick && setLightboxSrc(String(imgUrl))} />
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
        return <div className="aspect-video rounded-xl overflow-hidden shadow-sm"><iframe src={src} className="w-full h-full" allowFullScreen /></div>
      }
      return <video src={String(vidUrl)} poster={posterUrl ? String(posterUrl) : undefined} controls className="w-full rounded-xl shadow-sm" style={{ display: 'block' }} />
    }

    case 'audio':
      if (!c.publicUrl) return null
      return <audio src={String(c.publicUrl)} controls className="w-full" />

    case 'quote':
      return (
        <blockquote className="border-l-4 pl-5 py-1" style={{ borderColor: t.accent }}>
          <div className="rise-content italic" dangerouslySetInnerHTML={{ __html: String(c.text || '') }} />
          {c.author && <footer className="text-sm mt-2 not-italic" style={{ color: `${t.text}60` }}>— {String(c.author)}</footer>}
        </blockquote>
      )

    case 'callout':
      return (
        <div className="flex gap-3 rounded-lg p-4 border-l-4"
          style={{ backgroundColor: c.bgColor || `${t.primary}15`, borderColor: c.borderColor || t.primary }}>
          <span className="text-xl flex-shrink-0 mt-0.5">{c.icon || '💡'}</span>
          <div className="rise-content text-sm" dangerouslySetInnerHTML={{ __html: String(c.html || '') }} />
        </div>
      )

    case 'code_block':
      return (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {c.language && <div className="px-4 py-2 bg-gray-800 text-gray-400 text-xs border-b border-gray-700">{String(c.language)}</div>}
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto"><code>{String(c.code || '')}</code></pre>
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
                <span className="font-medium text-gray-900" dangerouslySetInnerHTML={{ __html: item.title }} />
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </summary>
              <div className="px-5 py-4 rise-content border-t border-gray-100" dangerouslySetInnerHTML={{ __html: item.bodyHtml || '' }} />
            </details>
          ))}
        </div>
      )
    }

    case 'tabs': {
      return <TabsBlock items={(c.items as Array<{ id: string; label: string; bodyHtml: string }>) || []} primary={t.primary} />
    }

    case 'button': {
      const alignment = c.alignment as string || 'left'
      const justifyClass = alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'
      return (
        <div className={`flex ${justifyClass}`}>
          <a href={String(c.url || '#')} target={c.openInNewTab ? '_blank' : undefined} rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-2.5 text-sm font-medium transition-colors text-white"
            style={{ backgroundColor: t.primary, borderRadius: t.btnRadius || '0.375rem' }}>
            {String(c.label || 'Button')}
          </a>
        </div>
      )
    }

    case 'statement':
      return (
        <div className="text-center py-8 px-6 rounded-xl" style={{ backgroundColor: `${t.primary}10` }}>
          <div className="rise-content" dangerouslySetInnerHTML={{ __html: String(c.text || '') }} />
        </div>
      )

    case 'quiz':
    case 'knowledge_check':
      return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
          <p className="text-gray-500 text-sm">Quiz — configure in editor</p>
        </div>
      )

    case 'columns': {
      const cols = (c.columns as Array<{ widthPct: number; blocks: Array<{ type: string; content: C; settings: C }> }>) || []
      return (
        <div className="flex gap-6 items-start flex-wrap md:flex-nowrap">
          {cols.map((col, i) => (
            <div key={i} style={{ flex: `0 0 calc(${col.widthPct}% - 0.75rem)`, minWidth: '200px' }}>
              {(col.blocks || []).map((b, j) => (
                <NativeBlockContent key={j}
                  block={{ id: `col-${i}-${j}`, lesson_id: '', type: b.type, position: j, content: b.content, settings: b.settings, created_at: '' }}
                  c={b.content} t={t} courseId={courseId} />
              ))}
            </div>
          ))}
        </div>
      )
    }

    case 'raw_scorm':
      return <ScormIframe baseUrl={String(c.baseUrl || '')} launchFile={String(c.launchFile || '')} title={String(c.itemTitle || c.courseTitle || '')} />

    case 'raw_html':
      return <div dangerouslySetInnerHTML={{ __html: String(c.html || '') }} />

    default:
      return (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-4 py-3 text-center text-gray-400 text-sm">
          {block.type.replace(/_/g, ' ')} block
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
      <div className="p-5 rise-content" dangerouslySetInnerHTML={{ __html: activeItem?.bodyHtml || '' }} />
    </div>
  )
}