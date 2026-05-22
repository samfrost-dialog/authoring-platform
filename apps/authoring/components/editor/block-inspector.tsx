'use client'

import dynamic from 'next/dynamic'
import QuizBuilder from '@/components/quiz/quiz-builder'
import type { Block } from './types'

const TiptapEditor = dynamic(
  () => import('./tiptap/tiptap-editor'),
  { ssr: false, loading: () => <div className="h-24 bg-[#0F0F10] border border-[#2A2A2E] rounded-lg animate-pulse" /> }
)

const MediaUploader = dynamic(
  () => import('./tiptap/media-uploader'),
  { ssr: false, loading: () => <div className="h-20 bg-[#0F0F10] border border-[#2A2A2E] rounded-lg animate-pulse" /> }
)

interface Props {
  block: Block | null
  courseId: string
  onUpdateContent: (content: Record<string, unknown>) => void
  onUpdateSettings: (settings: Record<string, unknown>) => void
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">{children}</label>
}
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2 mt-1">{children}</p>
}

function TextInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors" />
    </div>
  )
}
function TextArea({ label, value, onChange, placeholder, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
    </div>
  )
}
function Select({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider">{label}</span>
      <button onClick={() => onChange(!checked)} className={`w-8 h-4 rounded-full transition-colors relative ${checked ? 'bg-indigo-500' : 'bg-[#2A2A2E]'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}
function NumberInput({ label, value, onChange, min, max }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type="number" value={value} min={min} max={max} onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors" />
    </div>
  )
}
function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value || '#4F46E5'} onChange={(e) => onChange(e.target.value)} className="w-8 h-8 rounded cursor-pointer border border-[#2A2A2E] bg-transparent" />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#4F46E5"
          className="flex-1 bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors" />
      </div>
    </div>
  )
}

type IP = { block: Block; courseId: string; onUpdate: (c: Record<string, unknown>) => void }

function TextInspector({ block, onUpdate }: IP) {
  return <TiptapEditor content={block.content?.html || ''} onChange={(html) => onUpdate({ ...block.content, html })} placeholder="Start typing…" minHeight="160px" />
}

function ImageInspector({ block, courseId, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <MediaUploader
        courseId={courseId} category="image" accept="image/*"
        currentUrl={block.content?.publicUrl} currentKey={block.content?.src}
        label="image" maxSizeMB={10}
        onUpload={(key, publicUrl) => onUpdate({ ...block.content, src: key, publicUrl })}
        onRemove={() => onUpdate({ ...block.content, src: undefined, publicUrl: undefined })}
      />
      <TextInput label="Alt text" value={block.content?.alt || ''} onChange={(v) => onUpdate({ ...block.content, alt: v })} placeholder="Describe the image" />
      <TextInput label="Caption" value={block.content?.caption || ''} onChange={(v) => onUpdate({ ...block.content, caption: v })} placeholder="Optional caption" />
      <Select label="Alignment" value={block.content?.alignment || 'center'} onChange={(v) => onUpdate({ ...block.content, alignment: v })}
        options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
      <Select label="Size" value={block.content?.size || 'large'} onChange={(v) => onUpdate({ ...block.content, size: v })}
        options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'full', label: 'Full width' }]} />
    </div>
  )
}

function VideoInspector({ block, courseId, onUpdate }: IP) {
  const isUpload = !block.content?.type || block.content.type === 'upload'
  return (
    <div className="space-y-3">
      <Select label="Source type" value={block.content?.type || 'upload'} onChange={(v) => onUpdate({ ...block.content, type: v, src: undefined, publicUrl: undefined })}
        options={[{ value: 'upload', label: 'Upload' }, { value: 'youtube', label: 'YouTube' }, { value: 'vimeo', label: 'Vimeo' }]} />
      {isUpload ? (
        <MediaUploader
          courseId={courseId} category="video" accept="video/*"
          currentUrl={block.content?.publicUrl} currentKey={block.content?.src}
          label="video" maxSizeMB={500}
          onUpload={(key, publicUrl) => onUpdate({ ...block.content, src: key, publicUrl })}
          onRemove={() => onUpdate({ ...block.content, src: undefined, publicUrl: undefined })}
        />
      ) : (
        <TextInput label="URL" value={block.content?.src || ''} onChange={(v) => onUpdate({ ...block.content, src: v })} placeholder="https://youtube.com/watch?v=…" />
      )}
      <Toggle label="Autoplay" checked={!!block.content?.autoplay} onChange={(v) => onUpdate({ ...block.content, autoplay: v })} />
      <Toggle label="Show controls" checked={block.content?.controls !== false} onChange={(v) => onUpdate({ ...block.content, controls: v })} />
      <TextInput label="Caption" value={block.content?.caption || ''} onChange={(v) => onUpdate({ ...block.content, caption: v })} placeholder="Optional caption" />
    </div>
  )
}

function AudioInspector({ block, courseId, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <MediaUploader
        courseId={courseId} category="audio" accept="audio/*"
        currentUrl={block.content?.publicUrl} currentKey={block.content?.src}
        label="audio file" maxSizeMB={50}
        onUpload={(key, publicUrl) => onUpdate({ ...block.content, src: key, publicUrl })}
        onRemove={() => onUpdate({ ...block.content, src: undefined, publicUrl: undefined })}
      />
      <Toggle label="Autoplay" checked={!!block.content?.autoplay} onChange={(v) => onUpdate({ ...block.content, autoplay: v })} />
      <Toggle label="Show transcript" checked={block.content?.showTranscript !== false} onChange={(v) => onUpdate({ ...block.content, showTranscript: v })} />
      <SectionLabel>Transcript</SectionLabel>
      <TiptapEditor content={block.content?.transcript || ''} onChange={(v) => onUpdate({ ...block.content, transcript: v })} placeholder="Paste transcript…" minHeight="80px" />
    </div>
  )
}

function FileDownloadInspector({ block, courseId, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <MediaUploader
        courseId={courseId} category="file" accept=".pdf,.doc,.docx,.zip,.ppt,.pptx,.xls,.xlsx"
        currentUrl={block.content?.publicUrl} currentKey={block.content?.src}
        label="file" maxSizeMB={100}
        onUpload={(key, publicUrl) => onUpdate({ ...block.content, src: key, publicUrl, filename: key.split('/').pop() })}
        onRemove={() => onUpdate({ ...block.content, src: undefined, publicUrl: undefined })}
      />
      <TextInput label="Button label" value={block.content?.label || 'Download'} onChange={(v) => onUpdate({ ...block.content, label: v })} placeholder="Download" />
      <TextInput label="Filename override" value={block.content?.filename || ''} onChange={(v) => onUpdate({ ...block.content, filename: v })} placeholder="document.pdf" />
    </div>
  )
}

function QuoteInspector({ block, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <TiptapEditor content={block.content?.text || ''} onChange={(v) => onUpdate({ ...block.content, text: v })} placeholder="Quote text…" minHeight="80px" />
      <TextInput label="Author" value={block.content?.author || ''} onChange={(v) => onUpdate({ ...block.content, author: v })} placeholder="Author name" />
      <TextInput label="Attribution" value={block.content?.attribution || ''} onChange={(v) => onUpdate({ ...block.content, attribution: v })} placeholder="Role or source" />
      <Select label="Style" value={block.content?.style || 'standard'} onChange={(v) => onUpdate({ ...block.content, style: v })}
        options={[{ value: 'standard', label: 'Standard' }, { value: 'large', label: 'Large' }, { value: 'accent', label: 'Accent' }]} />
    </div>
  )
}

function CalloutInspector({ block, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <TextInput label="Icon (emoji)" value={block.content?.icon || '💡'} onChange={(v) => onUpdate({ ...block.content, icon: v })} />
      <TiptapEditor content={block.content?.html || ''} onChange={(v) => onUpdate({ ...block.content, html: v })} placeholder="Callout message…" minHeight="80px" />
      <ColorInput label="Background" value={block.content?.bgColor || '#1E1E3F'} onChange={(v) => onUpdate({ ...block.content, bgColor: v })} />
      <ColorInput label="Border" value={block.content?.borderColor || '#4F46E5'} onChange={(v) => onUpdate({ ...block.content, borderColor: v })} />
    </div>
  )
}

function CodeInspector({ block, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <Select label="Language" value={block.content?.language || 'javascript'} onChange={(v) => onUpdate({ ...block.content, language: v })}
        options={['javascript','typescript','python','html','css','sql','bash','json','yaml','markdown','rust','go','java','csharp'].map(l => ({ value: l, label: l }))} />
      <TextArea label="Code" value={block.content?.code || ''} onChange={(v) => onUpdate({ ...block.content, code: v })} placeholder="// Your code here" rows={8} />
      <Toggle label="Line numbers" checked={block.content?.showLineNumbers !== false} onChange={(v) => onUpdate({ ...block.content, showLineNumbers: v })} />
    </div>
  )
}

function DividerInspector({ block, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <Select label="Style" value={block.content?.style || 'solid'} onChange={(v) => onUpdate({ ...block.content, style: v })}
        options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} />
      <NumberInput label="Thickness (px)" value={block.content?.thickness || 1} onChange={(v) => onUpdate({ ...block.content, thickness: v })} min={1} max={8} />
      <ColorInput label="Colour" value={block.content?.color || '#2A2A2E'} onChange={(v) => onUpdate({ ...block.content, color: v })} />
    </div>
  )
}

function SpacerInspector({ block, onUpdate }: IP) {
  return <NumberInput label="Height (px)" value={block.content?.height || 40} onChange={(v) => onUpdate({ ...block.content, height: v })} min={8} max={400} />
}

function ButtonInspector({ block, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <TextInput label="Label" value={block.content?.label || ''} onChange={(v) => onUpdate({ ...block.content, label: v })} placeholder="Button text" />
      <TextInput label="URL" value={block.content?.url || ''} onChange={(v) => onUpdate({ ...block.content, url: v })} placeholder="https://…" />
      <Select label="Style" value={block.content?.style || 'primary'} onChange={(v) => onUpdate({ ...block.content, style: v })}
        options={[{ value: 'primary', label: 'Primary' }, { value: 'secondary', label: 'Secondary' }, { value: 'outline', label: 'Outline' }, { value: 'ghost', label: 'Ghost' }]} />
      <Toggle label="Open in new tab" checked={!!block.content?.openInNewTab} onChange={(v) => onUpdate({ ...block.content, openInNewTab: v })} />
    </div>
  )
}

function AccordionInspector({ block, onUpdate }: IP) {
  const items: Array<{ id: string; title: string; bodyHtml: string }> = block.content?.items || []
  function updateItem(i: number, field: string, value: string) {
    onUpdate({ ...block.content, items: items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) })
  }
  return (
    <div className="space-y-3">
      <Toggle label="Allow multiple open" checked={!!block.content?.allowMultiple} onChange={(v) => onUpdate({ ...block.content, allowMultiple: v })} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="bg-[#0F0F10] border border-[#2A2A2E] rounded-lg p-3 space-y-2">
            <div className="flex justify-between"><span className="text-[#555] text-xs">Item {i + 1}</span>
              <button onClick={() => onUpdate({ ...block.content, items: items.filter((_, idx) => idx !== i) })} className="text-[#444] hover:text-red-400 text-xs">Remove</button></div>
            <TextInput label="Title" value={item.title} onChange={(v) => updateItem(i, 'title', v)} />
            <div><Label>Body</Label><TiptapEditor content={item.bodyHtml} onChange={(v) => updateItem(i, 'bodyHtml', v)} minHeight="60px" /></div>
          </div>
        ))}
      </div>
      <button onClick={() => onUpdate({ ...block.content, items: [...items, { id: crypto.randomUUID(), title: 'New item', bodyHtml: '' }] })}
        className="w-full py-2 border border-dashed border-[#2A2A2E] rounded-lg text-[#555] hover:text-indigo-400 text-xs transition-colors">+ Add item</button>
    </div>
  )
}

function TabsInspector({ block, onUpdate }: IP) {
  const items: Array<{ id: string; label: string; bodyHtml: string }> = block.content?.items || []
  function updateItem(i: number, field: string, value: string) {
    onUpdate({ ...block.content, items: items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) })
  }
  return (
    <div className="space-y-3">
      <Select label="Orientation" value={block.content?.orientation || 'horizontal'} onChange={(v) => onUpdate({ ...block.content, orientation: v })}
        options={[{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }]} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="bg-[#0F0F10] border border-[#2A2A2E] rounded-lg p-3 space-y-2">
            <div className="flex justify-between"><span className="text-[#555] text-xs">Tab {i + 1}</span>
              <button onClick={() => onUpdate({ ...block.content, items: items.filter((_, idx) => idx !== i) })} className="text-[#444] hover:text-red-400 text-xs">Remove</button></div>
            <TextInput label="Label" value={item.label} onChange={(v) => updateItem(i, 'label', v)} />
            <div><Label>Content</Label><TiptapEditor content={item.bodyHtml} onChange={(v) => updateItem(i, 'bodyHtml', v)} minHeight="60px" /></div>
          </div>
        ))}
      </div>
      <button onClick={() => onUpdate({ ...block.content, items: [...items, { id: crypto.randomUUID(), label: 'New tab', bodyHtml: '' }] })}
        className="w-full py-2 border border-dashed border-[#2A2A2E] rounded-lg text-[#555] hover:text-indigo-400 text-xs transition-colors">+ Add tab</button>
    </div>
  )
}

function ChecklistInspector({ block, onUpdate }: IP) {
  const items: Array<{ id: string; text: string; checkedByDefault: boolean }> = block.content?.items || []
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <input type="checkbox" checked={item.checkedByDefault} className="accent-indigo-500" title="Default checked"
            onChange={(e) => onUpdate({ ...block.content, items: items.map((it, idx) => idx === i ? { ...it, checkedByDefault: e.target.checked } : it) })} />
          <input type="text" value={item.text} placeholder={`Item ${i + 1}`}
            onChange={(e) => onUpdate({ ...block.content, items: items.map((it, idx) => idx === i ? { ...it, text: e.target.value } : it) })}
            className="flex-1 bg-[#0F0F10] border border-[#2A2A2E] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors" />
          <button onClick={() => onUpdate({ ...block.content, items: items.filter((_, idx) => idx !== i) })} className="text-[#444] hover:text-red-400 text-xs">×</button>
        </div>
      ))}
      <button onClick={() => onUpdate({ ...block.content, items: [...items, { id: crypto.randomUUID(), text: '', checkedByDefault: false }] })}
        className="w-full py-1.5 border border-dashed border-[#2A2A2E] rounded-lg text-[#555] hover:text-indigo-400 text-xs transition-colors">+ Add item</button>
    </div>
  )
}

function EmbedInspector({ block, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <TextInput label="URL" value={block.content?.url || ''} onChange={(v) => onUpdate({ ...block.content, url: v })} placeholder="https://…" />
      <NumberInput label="Height (px)" value={block.content?.height || 400} onChange={(v) => onUpdate({ ...block.content, height: v })} min={100} max={2000} />
    </div>
  )
}

function StatementInspector({ block, onUpdate }: IP) {
  return (
    <div className="space-y-3">
      <TiptapEditor content={block.content?.text || ''} onChange={(v) => onUpdate({ ...block.content, text: v })} placeholder="Statement text…" minHeight="80px" />
      <Select label="Style" value={block.content?.style || 'standard'} onChange={(v) => onUpdate({ ...block.content, style: v })}
        options={[{ value: 'standard', label: 'Standard' }, { value: 'big', label: 'Big' }, { value: 'quote', label: 'Quote' }]} />
    </div>
  )
}

function GenericInspector({ block }: { block: Block }) {
  return (
    <div className="bg-[#141416] border border-[#1E1E22] rounded-lg p-3">
      <p className="text-[#555] text-xs">Full inspector for <span className="text-[#888]">{block.type.replace(/_/g, ' ')}</span> coming in a future phase.</p>
    </div>
  )
}

function SettingsPanel({ block, onUpdate }: { block: Block; onUpdate: (s: Record<string, unknown>) => void }) {
  return (
    <Select label="Spacing" value={block.settings?.spacing || 'normal'} onChange={(v) => onUpdate({ ...block.settings, spacing: v })}
      options={[{ value: 'compact', label: 'Compact' }, { value: 'normal', label: 'Normal' }, { value: 'loose', label: 'Loose' }]} />
  )
}

export default function BlockInspector({ block, courseId, onUpdateContent, onUpdateSettings }: Props) {
  if (!block) {
    return (
      <div className="w-64 bg-[#111113] border-l border-[#1E1E22] flex items-center justify-center flex-shrink-0">
        <p className="text-[#444] text-xs text-center px-4">Select a block to edit its settings</p>
      </div>
    )
  }

  const props: IP = { block, courseId, onUpdate: onUpdateContent }

  const inspector = (() => {
    switch (block.type) {
      case 'text':          return <TextInspector {...props} />
      case 'image':         return <ImageInspector {...props} />
      case 'video':         return <VideoInspector {...props} />
      case 'audio':         return <AudioInspector {...props} />
      case 'file_download': return <FileDownloadInspector {...props} />
      case 'quote':         return <QuoteInspector {...props} />
      case 'callout':       return <CalloutInspector {...props} />
      case 'code_block':    return <CodeInspector {...props} />
      case 'divider':       return <DividerInspector {...props} />
      case 'spacer':        return <SpacerInspector {...props} />
      case 'button':        return <ButtonInspector {...props} />
      case 'accordion':     return <AccordionInspector {...props} />
      case 'tabs':          return <TabsInspector {...props} />
      case 'checkbox_list': return <ChecklistInspector {...props} />
      case 'embed':         return <EmbedInspector {...props} />
      case 'statement':     return <StatementInspector {...props} />
      case 'quiz':          return <QuizBuilder content={block.content} onChange={(c) => onUpdateContent(c as Record<string, unknown>)} isKnowledgeCheck={false} />
      case 'knowledge_check': return <QuizBuilder content={block.content} onChange={(c) => onUpdateContent(c as Record<string, unknown>)} isKnowledgeCheck={true} />
      default:              return <GenericInspector block={block} />
    }
  })()

  return (
    <div className="w-64 bg-[#111113] border-l border-[#1E1E22] flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-4 py-3 border-b border-[#1E1E22]">
        <span className="text-[#666] text-xs font-medium uppercase tracking-wider">{block.type.replace(/_/g, ' ')}</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-[#1E1E22]">
          <SectionLabel>Content</SectionLabel>
          {inspector}
        </div>
        <div className="p-4">
          <SectionLabel>Layout</SectionLabel>
          <SettingsPanel block={block} onUpdate={onUpdateSettings} />
        </div>
      </div>
    </div>
  )
}