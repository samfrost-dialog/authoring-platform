'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const QuizRuntime = dynamic(() => import('@/components/quiz/quiz-runtime'), { ssr: false })
const ScenarioRuntime = dynamic(() => import('@/components/quiz/scenario-runtime'), { ssr: false })
type Block = { id: string; lesson_id: string; type: string; position: number; content: Record<string, unknown>; settings: Record<string, unknown>; created_at: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = Record<string, any>

type BlockTheme = { primary: string; accent: string; text: string; bg: string; headingFont: string; bodyFont: string; btnRadius?: string }

function ZoomableImage({ src, alt, caption, alignment, size, textColor, borderRadius, zoom = true }: { src: string; alt: string; caption: string; alignment: string; size: string; textColor: string; borderRadius?: string; zoom?: boolean }) {
  const [zoomed, setZoomed] = useState(false)
  const radius = borderRadius !== undefined ? borderRadius : '0.75rem'
  const alignClass = alignment === 'center' ? 'mx-auto text-center' : alignment === 'right' ? 'ml-auto' : ''
  const sizeClass = size === 'small' ? 'max-w-xs' : size === 'medium' ? 'max-w-md' : size === 'full' ? 'w-full' : 'max-w-3xl'
  return (
    <>
      <figure className={`${alignClass} ${sizeClass}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt}
          className="w-full shadow-sm hover:opacity-95 transition-opacity"
          style={{ borderRadius: radius, cursor: zoom ? 'zoom-in' : 'default' }}
          onClick={() => zoom && setZoomed(true)} />
        {caption && <figcaption className="text-sm mt-2 text-center" style={{ color: `${textColor}60` }}>{caption}</figcaption>}
      </figure>
      {zoomed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          style={{ backgroundColor: 'rgba(0,0,0,0.9)' }} onClick={() => setZoomed(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-w-full max-h-full rounded-lg shadow-2xl cursor-zoom-out"
            onClick={(e) => e.stopPropagation()} />
          {caption && <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm">{caption}</p>}
        </div>
      )}
    </>
  )
}

export default function PreviewBlockRenderer({ block, theme, courseId }: { block: Block; theme?: BlockTheme; courseId?: string }) {
  const t = theme ?? { primary: '#4F46E5', accent: '#06B6D4', text: '#111827', bg: '#FFFFFF', headingFont: 'Inter', bodyFont: 'Inter' }
  const c: C = block.content || {}
  const spacing = block.settings?.spacing || 'normal'
  const py = spacing === 'compact' ? 'py-1' : spacing === 'loose' ? 'py-6' : 'py-2'

  return (
    <div className={py}>
      <BlockContent block={block} c={c} t={t} courseId={courseId} />
    </div>
  )
}

function BlockContent({ block, c, t, courseId }: { block: Block; c: C; t: BlockTheme; courseId?: string }) {
  switch (block.type) {

    case 'text': {
      if (!c.html) return null
      const bgColor = c.backgroundColor as string | undefined
      const resolvedBg = bgColor === '__accent__' ? t.accent : bgColor || undefined
      const textColor = resolvedBg && resolvedBg !== 'transparent' ? '#fff' : t.text
      const textWidth = c.textWidth as number | undefined
      const maxW = textWidth ? `${textWidth}%` : '100%'
      if (resolvedBg) {
        return (
          <div style={{ backgroundColor: resolvedBg, margin: '0 calc(-2rem)', padding: '3rem 2rem' }}>
            <div className="rise-content" style={{ color: textColor, fontFamily: `'${t.bodyFont}', sans-serif`, maxWidth: maxW, margin: '0 auto' }}
              dangerouslySetInnerHTML={{ __html: c.html }} />
          </div>
        )
      }
      return (
        <div className="rise-content" style={{ color: textColor, fontFamily: `'${t.bodyFont}', sans-serif`, maxWidth: maxW, margin: '0 auto' }}
          dangerouslySetInnerHTML={{ __html: c.html }} />
      )
    }

    case 'image': {
      const imgUrl = c.publicUrl || c.src
      if (!imgUrl) return (
        <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">No image</div>
      )
      const caption = c.caption ? String(c.caption).replace(/<[^>]*>/g, '').trim() : ''
      const radius = c.borderRadius !== undefined ? String(c.borderRadius) : '0.75rem'
      const variant = c.riseVariant as string | undefined
      const bgColor = c.backgroundColor as string | undefined
      const resolvedBg = bgColor === '__accent__' ? t.accent : bgColor || undefined
      const ptRem = ((c.paddingTop as number) || 0) * 0.5
      const pbRem = ((c.paddingBottom as number) || 0) * 0.5

      // text overlay — full width image with text overlaid on top
      if (variant === 'text overlay') {
        const overlayText = c.overlayText as string | undefined
        const overlayOpacity = parseFloat(String(c.overlayOpacity || 0.1))
        const overlayColor = c.overlayColor as string || '#000000'
        return (
          <div style={{ position: 'relative', margin: '0 calc(-2rem)', backgroundColor: resolvedBg, paddingTop: `${ptRem}rem`, paddingBottom: `${pbRem}rem` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(imgUrl)} alt={String(c.alt || '')} style={{ width: '100%', display: 'block', borderRadius: 0 }} />
            {overlayOpacity > 0 && (
              <div style={{ position: 'absolute', inset: 0, backgroundColor: overlayColor, opacity: overlayOpacity }} />
            )}
            {overlayText && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '2rem 3rem' }}>
                <div className="rise-content" style={{ color: '#fff', maxWidth: '50%' }} dangerouslySetInnerHTML={{ __html: overlayText }} />
              </div>
            )}
          </div>
        )
      }

      // hero — full width with caption below, section background color
      if (variant === 'hero') {
        return (
          <div style={{ margin: '0 calc(-2rem)', backgroundColor: resolvedBg, paddingTop: `${ptRem}rem`, paddingBottom: `${pbRem}rem` }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={String(imgUrl)} alt={String(c.alt || '')} style={{ width: '100%', display: 'block', borderRadius: 0 }} />
            {caption && (
              <div className="rise-content" style={{ padding: '1.5rem 2rem', color: resolvedBg && resolvedBg !== 'transparent' ? '#fff' : t.text, textAlign: 'center' }}
                dangerouslySetInnerHTML={{ __html: String(c.caption || caption) }} />
            )}
          </div>
        )
      }

      // standard image
      return (
        <div style={{ backgroundColor: resolvedBg, paddingTop: resolvedBg ? `${ptRem + 1}rem` : 0, paddingBottom: resolvedBg ? `${pbRem + 1}rem` : 0, margin: resolvedBg ? '0 calc(-2rem)' : 0, padding: resolvedBg ? `${ptRem + 1}rem 2rem` : 0 }}>
          <ZoomableImage src={String(imgUrl)} alt={String(c.alt || '')} caption={caption} alignment={String(c.alignment || 'center')} size={String(c.size || 'large')} textColor={resolvedBg ? '#fff' : t.text} borderRadius={radius} zoom={!!c.zoomOnClick} />
        </div>
      )
    }

    case 'video': {
      const vidUrl = c.publicUrl || c.src
      const posterUrl = c.posterPublicUrl || c.poster
      const radius = c.borderRadius !== undefined ? String(c.borderRadius) : '0.75rem'
      if (!vidUrl) return (
        <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">No video</div>
      )
      if (c.type === 'youtube' || c.type === 'vimeo') {
        const src = c.type === 'youtube'
          ? String(vidUrl).replace('watch?v=', 'embed/')
          : String(vidUrl).replace('vimeo.com/', 'player.vimeo.com/video/')
        return <div className="aspect-video overflow-hidden" style={{ borderRadius: radius }}><iframe src={src} className="w-full h-full" allowFullScreen /></div>
      }
      return (
        <video
          src={String(vidUrl)}
          poster={posterUrl ? String(posterUrl) : undefined}
          controls={c.controls !== false}
          autoPlay={!!c.autoPlay}
          className="w-full"
          style={{ borderRadius: radius, display: 'block' }}
        />
      )
    }

    case 'audio':
      if (!c.publicUrl) return null
      return (
        <div className="space-y-3">
          <audio src={c.publicUrl} controls autoPlay={!!c.autoPlay} className="w-full" />
          {c.showTranscript !== false && c.transcript && (
            <details className="bg-gray-50 rounded-lg p-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">Transcript</summary>
              <div className="prose prose-sm prose-gray mt-3 max-w-none" dangerouslySetInnerHTML={{ __html: c.transcript }} />
            </details>
          )}
        </div>
      )

    case 'file_download':
      if (!c.publicUrl) return null
      return (
        <a href={c.publicUrl} download={c.filename} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 transition-colors group">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-indigo-500">
            <path d="M10 3v10M6 9l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{c.label || 'Download'}</p>
            {c.filename && <p className="text-xs text-gray-500">{c.filename}</p>}
          </div>
        </a>
      )

    case 'quote':
      return (
        <blockquote className={`border-l-4 border-indigo-400 pl-5 py-1 ${c.style === 'large' ? 'text-xl' : 'text-base'}`}>
          <div className="prose prose-gray max-w-none italic" dangerouslySetInnerHTML={{ __html: c.text || '' }} />
          {c.author && (
            <footer className="mt-2 text-sm text-gray-500 not-italic">
              — {c.author}{c.attribution ? `, ${c.attribution}` : ''}
            </footer>
          )}
        </blockquote>
      )

    case 'callout':
      return (
        <div className="flex gap-3 rounded-lg p-4 border-l-4"
          style={{ backgroundColor: c.bgColor || t.primary + '15', borderColor: c.borderColor || t.primary }}>
          <span className="text-xl flex-shrink-0 mt-0.5">{c.icon || '💡'}</span>
          <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: c.html || '' }} />
        </div>
      )

    case 'code_block':
      return (
        <div className="bg-gray-900 rounded-lg overflow-hidden">
          {c.language && (
            <div className="px-4 py-2 bg-gray-800 text-gray-400 text-xs border-b border-gray-700">{c.language}</div>
          )}
          <pre className="p-4 text-sm text-gray-100 overflow-x-auto"><code>{c.code || ''}</code></pre>
        </div>
      )

    case 'divider':
      return (
        <hr style={{
          borderStyle: c.style || 'solid',
          borderColor: c.color || '#E5E7EB',
          borderTopWidth: `${c.thickness || 1}px`,
        }} />
      )

    case 'spacer':
      return <div style={{ height: `${c.height || 40}px` }} />

    case 'embed':
      if (!c.url) return null
      return (
        <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: `${c.height || 400}px` }}>
          <iframe src={c.url} className="w-full h-full" sandbox="allow-scripts allow-same-origin" />
        </div>
      )

    case 'accordion': {
      const items: Array<{ id: string; title: string; bodyHtml: string }> = c.items || []
      return (
        <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
          {items.map((item) => (
            <details key={item.id} className="group">
              <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                <span className="font-medium text-gray-900">{item.title}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </summary>
              <div className="px-5 py-4 prose prose-sm prose-gray max-w-none border-t border-gray-100"
                dangerouslySetInnerHTML={{ __html: item.bodyHtml || '' }} />
            </details>
          ))}
        </div>
      )
    }

    case 'tabs':
      return <TabsBlock items={c.items || []} />

    case 'button':
      return (
        <div className={`flex ${c.alignment === 'center' ? 'justify-center' : c.alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
          <a href={c.url || '#'} target={c.openInNewTab ? '_blank' : undefined} rel="noopener noreferrer"
            className={`inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              c.style === 'outline' ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50' :
              c.style === 'ghost' ? 'text-indigo-600 hover:bg-indigo-50' :
              c.style === 'secondary' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' :
              'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}>
            {c.label || 'Button'}
          </a>
        </div>
      )

    case 'checkbox_list': {
      const items: Array<{ id: string; text: string; checkedByDefault: boolean }> = c.items || []
      return (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3">
              <input type="checkbox" defaultChecked={item.checkedByDefault} className="w-4 h-4 accent-indigo-600 rounded" />
              <span className="text-gray-700 text-sm">{item.text}</span>
            </li>
          ))}
        </ul>
      )
    }

    case 'statement':
      return (
        <div className={`text-center py-8 px-6 rounded-xl bg-indigo-50 ${c.style === 'big' ? 'text-3xl font-bold' : 'text-lg'}`}>
          <div className="prose prose-gray max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: c.text || '' }} />
        </div>
      )

    case 'quiz':
      if (!c.questions?.length) return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center text-gray-400 text-sm">No questions added yet</div>
      )
      return <QuizRuntime content={c as unknown as import('@/components/quiz/quiz-types').QuizContent} isKnowledgeCheck={false} courseId={courseId} />
    case 'knowledge_check':
      if (!c.questions?.length) return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center text-gray-400 text-sm">No questions added yet</div>
      )
      return <QuizRuntime content={c as unknown as import('@/components/quiz/quiz-types').QuizContent} isKnowledgeCheck={true} courseId={courseId} />

    case 'scenario':
      if (!c.scenes?.length) return (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center text-gray-400 text-sm">No scenes added yet</div>
      )
      return <ScenarioRuntime content={c as unknown as import('@/components/quiz/scenario-types').ScenarioContent} />

    case 'continue':
      return (
        <div className="flex justify-center">
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-8 py-3 rounded-lg transition-colors">
            {c.label || 'Continue'}
          </button>
        </div>
      )

    case 'columns': {
      const cols = (c.columns as Array<{ widthPct: number; blocks: Array<{ type: string; content: Record<string, unknown>; settings: Record<string, unknown> }> }>) || []
      const bgColor = c.backgroundColor as string | undefined
      const resolvedBg = bgColor === '__accent__' ? t.accent : bgColor || undefined
      const ptRem = ((c.paddingTop as number) || 0) * 0.5
      const pbRem = ((c.paddingBottom as number) || 0) * 0.5
      return (
        <div style={{ backgroundColor: resolvedBg, margin: resolvedBg ? '0 calc(-2rem)' : 0, padding: resolvedBg ? `${Math.max(ptRem,1)}rem 2rem ${Math.max(pbRem,1)}rem` : 0 }}>
          <div className="flex gap-6 items-start flex-wrap md:flex-nowrap">
            {cols.map((col, i) => (
              <div key={i} style={{ flex: `0 0 calc(${col.widthPct}% - 0.75rem)`, minWidth: '200px' }}>
                {(col.blocks || []).map((b, j) => (
                  <BlockContent
                    key={j}
                    block={{ id: `col-${i}-${j}`, lesson_id: '', type: b.type, position: j, content: b.content, settings: b.settings, created_at: '' }}
                    c={b.content as C}
                    t={t}
                    courseId={courseId}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case 'raw_html':
      return <div dangerouslySetInnerHTML={{ __html: c.html || '' }} />

    default:
      return (
        <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg px-4 py-3 text-center text-gray-400 text-sm">
          {block.type.replace(/_/g, ' ')} block
        </div>
      )
  }
}

function TabsBlock({ items }: { items: Array<{ id: string; label: string; bodyHtml: string }> }) {
  const [active, setActive] = useState(items[0]?.id ?? '')
  const activeItem = items.find((i) => i.id === active)

  if (!items.length) return null

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="flex border-b border-gray-200 bg-gray-50">
        {items.map((item) => (
          <button key={item.id} onClick={() => setActive(item.id)}
            className={`px-5 py-3 text-sm font-medium transition-colors ${
              item.id === active ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white -mb-px' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {item.label}
          </button>
        ))}
      </div>
      <div className="p-5 prose prose-sm prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: activeItem?.bodyHtml || '' }} />
    </div>
  )
}