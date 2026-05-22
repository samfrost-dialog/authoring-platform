'use client'

import { useState } from 'react'
type Block = { id: string; lesson_id: string; type: string; position: number; content: Record<string, unknown>; settings: Record<string, unknown>; created_at: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type C = Record<string, any>

type BlockTheme = { primary: string; accent: string; text: string; bg: string; headingFont: string; bodyFont: string }

export default function PreviewBlockRenderer({ block, theme }: { block: Block; theme?: BlockTheme }) {
  const t = theme ?? { primary: '#4F46E5', accent: '#06B6D4', text: '#111827', bg: '#FFFFFF', headingFont: 'Inter', bodyFont: 'Inter' }
  const c: C = block.content || {}
  const spacing = block.settings?.spacing || 'normal'
  const py = spacing === 'compact' ? 'py-1' : spacing === 'loose' ? 'py-6' : 'py-2'

  return (
    <div className={py}>
      <BlockContent block={block} c={c} t={t} />
    </div>
  )
}

function BlockContent({ block, c, t }: { block: Block; c: C; t: BlockTheme }) {
  switch (block.type) {

    case 'text':
      if (!c.html) return null
      return <div className="prose prose-gray max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: c.html }} />

    case 'image':
      if (!c.publicUrl) return (
        <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">No image</div>
      )
      return (
        <figure className={`${c.alignment === 'center' ? 'mx-auto text-center' : c.alignment === 'right' ? 'ml-auto' : ''} ${
          c.size === 'small' ? 'max-w-xs' : c.size === 'medium' ? 'max-w-md' : c.size === 'full' ? 'w-full' : 'max-w-2xl'
        }`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.publicUrl} alt={c.alt || ''} className="rounded-lg w-full" />
          {c.caption && <figcaption className="text-sm text-gray-500 mt-2">{c.caption}</figcaption>}
        </figure>
      )

    case 'video':
      if (!c.publicUrl && !c.src) return (
        <div className="h-40 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-sm">No video</div>
      )
      if (c.type === 'youtube' || c.type === 'vimeo') {
        const src = c.type === 'youtube'
          ? c.src.replace('watch?v=', 'embed/')
          : c.src.replace('vimeo.com/', 'player.vimeo.com/video/')
        return <div className="aspect-video rounded-lg overflow-hidden"><iframe src={src} className="w-full h-full" allowFullScreen /></div>
      }
      return <video src={c.publicUrl} controls={c.controls !== false} autoPlay={!!c.autoPlay} className="w-full rounded-lg" />

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
    case 'knowledge_check':
      return (
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold">?</span>
          </div>
          <p className="text-gray-600 text-sm">Quiz engine coming in Phase 3</p>
        </div>
      )

    case 'scenario':
      return (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-6 text-center">
          <p className="text-gray-600 text-sm">Branching scenario coming in Phase 3</p>
        </div>
      )

    case 'continue':
      return (
        <div className="flex justify-center">
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-8 py-3 rounded-lg transition-colors">
            {c.label || 'Continue'}
          </button>
        </div>
      )

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