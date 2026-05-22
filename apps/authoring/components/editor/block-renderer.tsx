import type { Block } from './types'

const BLOCK_TYPE_LABELS: Record<string, string> = {
  text:             'Text',
  image:            'Image',
  video:            'Video',
  audio:            'Audio',
  file_download:    'File Download',
  embed:            'Embed',
  divider:          'Divider',
  spacer:           'Spacer',
  quote:            'Quote',
  callout:          'Callout',
  code_block:       'Code',
  annotated_image:  'Annotated Image',
  chart:            'Chart',
  accordion:        'Accordion',
  tabs:             'Tabs',
  process:          'Process',
  timeline:         'Timeline',
  flashcards:       'Flashcards',
  sorting_activity: 'Sorting Activity',
  labeled_graphic:  'Labeled Graphic',
  button:           'Button',
  button_stack:     'Button Stack',
  checkbox_list:    'Checklist',
  numbered_list:    'Numbered List',
  columns:          'Columns',
  sidebar:          'Sidebar',
  statement:        'Statement',
  gallery:          'Gallery',
  carousel:         'Carousel',
  hotspot:          'Hotspot',
  flip_cards:       'Flip Cards',
  drag_drop:        'Drag & Drop',
  knowledge_check:  'Knowledge Check',
  quiz:             'Quiz',
  survey:           'Survey',
  scenario:         'Branching Scenario',
  certificate:      'Certificate',
  continue:         'Continue',
  raw_html:         'HTML (imported)',
}

function TextBlock({ content }: { content: { html?: string } }) {
  if (!content.html) return <PlaceholderBlock label="Text" hint="Click to add text" />
  return (
    <div
      className="text-[#ccc] text-sm leading-relaxed prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: content.html }}
    />
  )
}

function ImageBlock({ content }: { content: { alt?: string; caption?: string; publicUrl?: string; src?: string } }) {
  const url = content.publicUrl || content.src
  if (url && !url.startsWith('__import__')) {
    return (
      <div className="space-y-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={content.alt || ''} className="w-full rounded-lg object-cover max-h-64" />
        {content.caption && <div className="text-[#666] text-xs text-center" dangerouslySetInnerHTML={{ __html: String(content.caption).replace(/<[^>]*>/g, '') }} />}
      </div>
    )
  }
  return (
    <div className="space-y-1">
      <div className="h-32 bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mx-auto mb-1 text-[#444]">
            <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-[#555] text-xs">No image selected</p>
        </div>
      </div>
      {content.caption && <p className="text-[#666] text-xs text-center">{content.caption}</p>}
    </div>
  )
}

function VideoBlock({ content }: { content: { src?: string; publicUrl?: string; type?: string; controls?: boolean } }) {
  const url = content.publicUrl || content.src
  if (url && (content.type === 'youtube' || content.type === 'vimeo')) {
    const embedSrc = content.type === 'youtube'
      ? url.replace('watch?v=', 'embed/')
      : url.replace('vimeo.com/', 'player.vimeo.com/video/')
    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe src={embedSrc} className="w-full h-full" allowFullScreen />
      </div>
    )
  }
  if (url && !url.startsWith('__import__')) {
    return (
      <video src={url} controls className="w-full rounded-lg max-h-64" />
    )
  }
  return (
    <div className="h-32 bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full bg-[#2A2A2E] flex items-center justify-center mx-auto mb-1">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 2l7 4-7 4V2z" fill="#666"/>
          </svg>
        </div>
        <p className="text-[#555] text-xs">{url ? 'Video added' : 'No video selected'}</p>
      </div>
    </div>
  )
}

function QuoteBlock({ content }: { content: { text?: string; author?: string } }) {
  return (
    <div className="border-l-2 border-indigo-500 pl-4 py-1">
      <p className="text-[#ccc] text-sm italic">{content.text || 'Add a quote…'}</p>
      {content.author && <p className="text-[#666] text-xs mt-1">— {content.author}</p>}
    </div>
  )
}

function CalloutBlock({ content }: { content: { icon?: string; html?: string } }) {
  return (
    <div className="flex gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
      <span className="text-lg flex-shrink-0">{content.icon || '💡'}</span>
      <div
        className="text-[#ccc] text-sm"
        dangerouslySetInnerHTML={{ __html: content.html || 'Add callout text…' }}
      />
    </div>
  )
}

function DividerBlock({ content }: { content: { style?: string; color?: string } }) {
  return (
    <hr
      className="my-2"
      style={{
        borderStyle: content.style || 'solid',
        borderColor: content.color || '#2A2A2E',
        borderTopWidth: '1px',
      }}
    />
  )
}

function SpacerBlock({ content }: { content: { height?: number } }) {
  return (
    <div
      className="w-full bg-[#1A1A1C] border border-dashed border-[#2A2A2E] rounded flex items-center justify-center"
      style={{ height: `${content.height || 40}px` }}
    >
      <span className="text-[#444] text-xs">{content.height || 40}px spacer</span>
    </div>
  )
}

function CodeBlock({ content }: { content: { code?: string; language?: string } }) {
  return (
    <div className="bg-[#0D0D0F] border border-[#2A2A2E] rounded-lg overflow-hidden">
      {content.language && (
        <div className="px-3 py-1.5 bg-[#1A1A1C] border-b border-[#2A2A2E]">
          <span className="text-[#555] text-xs">{content.language}</span>
        </div>
      )}
      <pre className="p-3 text-xs text-[#ccc] overflow-x-auto">
        <code>{content.code || '// Add your code here'}</code>
      </pre>
    </div>
  )
}

function AccordionBlock({ content }: { content: { items?: Array<{ title: string }> } }) {
  const items = content.items || []
  return (
    <div className="space-y-1">
      {items.length === 0 ? (
        <PlaceholderBlock label="Accordion" hint="Add accordion items in the inspector" />
      ) : (
        items.map((item, i) => (
          <div key={i} className="flex items-center justify-between bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg px-4 py-3">
            <span className="text-[#ccc] text-sm">{item.title}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4l3 3 3-3" stroke="#666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        ))
      )}
    </div>
  )
}

function QuizBlock({ content, isKnowledgeCheck }: { content: { questions?: Array<{ prompt?: string }> }; isKnowledgeCheck: boolean }) {
  const questions = content.questions || []
  const color = isKnowledgeCheck ? 'emerald' : 'indigo'
  const label = isKnowledgeCheck ? 'Knowledge Check' : 'Quiz'
  return (
    <div className={`border rounded-lg p-4 ${isKnowledgeCheck ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-[#141416] border-[#2A2A2E]'}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isKnowledgeCheck ? 'bg-emerald-500/20' : 'bg-indigo-500/20'}`}>
          <span className={`text-xs font-bold ${isKnowledgeCheck ? 'text-emerald-400' : 'text-indigo-400'}`}>?</span>
        </div>
        <span className={`text-xs font-medium uppercase tracking-wider ${isKnowledgeCheck ? 'text-emerald-400' : 'text-[#888]'}`}>{label}</span>
        <span className="text-[#555] text-xs ml-auto">{questions.length} question{questions.length !== 1 ? 's' : ''}</span>
      </div>
      {questions.length === 0 ? (
        <p className="text-[#555] text-xs">Add questions in the inspector →</p>
      ) : (
        <p className="text-[#555] text-xs truncate">{(questions[0] as { prompt?: string }).prompt || 'No prompt set'}{questions.length > 1 ? ` + ${questions.length - 1} more` : ''}</p>
      )}
    </div>
  )
}

function ButtonBlock({ content }: { content: { label?: string; style?: string } }) {
  return (
    <div className="flex justify-center py-1">
      <div className={`px-6 py-2.5 rounded-lg text-sm font-medium ${
        content.style === 'outline'
          ? 'border border-indigo-500 text-indigo-400'
          : 'bg-indigo-500 text-white'
      }`}>
        {content.label || 'Button label'}
      </div>
    </div>
  )
}

function PlaceholderBlock({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex items-center gap-3 bg-[#141416] border border-dashed border-[#2A2A2E] rounded-lg px-4 py-3">
      <span className="text-[#555] text-xs font-medium">{label}</span>
      {hint && <span className="text-[#444] text-xs">{hint}</span>}
    </div>
  )
}

export default function BlockRenderer({ block }: { block: Block }) {
  const content = block.content || {}

  switch (block.type) {
    case 'text':           return <TextBlock content={content} />
    case 'image':          return <ImageBlock content={content} />
    case 'video':          return <VideoBlock content={content} />
    case 'quote':          return <QuoteBlock content={content} />
    case 'callout':        return <CalloutBlock content={content} />
    case 'divider':        return <DividerBlock content={content} />
    case 'spacer':         return <SpacerBlock content={content} />
    case 'code_block':     return <CodeBlock content={content} />
    case 'accordion':      return <AccordionBlock content={content} />
    case 'quiz':           return <QuizBlock content={content} isKnowledgeCheck={false} />
    case 'knowledge_check': return <QuizBlock content={content} isKnowledgeCheck={true} />
    case 'button':         return <ButtonBlock content={content} />
    case 'columns': {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cols = (content.columns as any[]) || []
      return (
        <div className="flex gap-3">
          {cols.map((col: { widthPct: number; blocks: Array<{ type: string; content: Record<string, unknown>; settings: Record<string, unknown> }> }, i: number) => (
            <div key={i} className="flex-1 space-y-2 min-w-0">
              {(col.blocks || []).map((b, j: number) => {
                const url = (b.content?.publicUrl || b.content?.src) as string | undefined
                if (b.type === 'image' && url) {
                  return (
                    <div key={j}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full rounded-lg object-cover max-h-48" />
                    </div>
                  )
                }
                if (b.type === 'text' && b.content?.html) {
                  return <div key={j} className="text-[#ccc] text-xs leading-relaxed prose-sm" dangerouslySetInnerHTML={{ __html: b.content.html as string }} />
                }
                return <div key={j} className="h-12 bg-[#1A1A1C] rounded border border-[#2A2A2E] flex items-center justify-center text-[#444] text-xs">{b.type}</div>
              })}
            </div>
          ))}
        </div>
      )
    }
    default:
      return (
        <PlaceholderBlock
          label={BLOCK_TYPE_LABELS[block.type] || block.type}
          hint="Configure in inspector →"
        />
      )
  }
}