'use client'

import dynamic from 'next/dynamic'
import type { Block } from './types'

// Load Tiptap client-side only (no SSR)
const TiptapEditor = dynamic(
  () => import('./tiptap/tiptap-editor'),
  { ssr: false, loading: () => <div className="h-24 bg-[#0F0F10] border border-[#2A2A2E] rounded-lg animate-pulse" /> }
)

interface Props {
  block: Block | null
  onUpdateContent: (content: Record<string, unknown>) => void
  onUpdateSettings: (settings: Record<string, unknown>) => void
}

// ── Shared field components ───────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[10px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">
      {children}
    </label>
  )
}

function TextInput({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors resize-none"
      />
    </div>
  )
}

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function Toggle({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-8 h-4 rounded-full transition-colors relative ${checked ? 'bg-indigo-500' : 'bg-[#2A2A2E]'}`}
      >
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

function NumberInput({ label, value, onChange, min, max }: {
  label: string; value: number; onChange: (v: number) => void; min?: number; max?: number
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  )
}

function ColorInput({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value || '#4F46E5'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border border-[#2A2A2E] bg-transparent"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#4F46E5"
          className="flex-1 bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-[#555] uppercase tracking-wider mb-2 mt-1">{children}</p>
}

// ── Block inspectors ──────────────────────────────────────────────────────────

type InspectorProps = { block: Block; onUpdate: (c: Record<string, unknown>) => void }

function TextInspector({ block, onUpdate }: InspectorProps) {
  return (
    <div className="space-y-3">
      <TiptapEditor
        content={block.content?.html || ''}
        onChange={(html) => onUpdate({ ...block.content, html })}
        placeholder="Start typing your content…"
        minHeight="160px"
      />
    </div>
  )
}

function ImageInspector({ block, onUpdate }: InspectorProps) {
  return (
    <div className="space-y-3">
      <div className="bg-[#141416] border border-dashed border-[#2A2A2E] rounded-lg p-4 text-center">
        <p className="text-[#555] text-xs">Media upload — Phase 1e</p>
      </div>
      <TextInput label="Alt text" value={block.content?.alt || ''} onChange={(v) => onUpdate({ ...block.content, alt: v })} placeholder="Describe the image" />
      <TextInput label="Caption" value={block.content?.caption || ''} onChange={(v) => onUpdate({ ...block.content, caption: v })} placeholder="Optional caption" />
      <Select label="Alignment" value={block.content?.alignment || 'center'} onChange={(v) => onUpdate({ ...block.content, alignment: v })}
        options={[{ value: 'left', label: 'Left' }, { value: 'center', label: 'Center' }, { value: 'right', label: 'Right' }]} />
      <Select label="Size" value={block.content?.size || 'large'} onChange={(v) => onUpdate({ ...block.content, size: v })}
        options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }, { value: 'full', label: 'Full width' }]} />
    </div>
  )
}

function VideoInspector({ block, onUpdate }: InspectorProps) {
  return (
    <div className="space-y-3">
      <Select label="Source type" value={block.content?.type || 'upload'} onChange={(v) => onUpdate({ ...block.content, type: v })}
        options={[{ value: 'upload', label: 'Upload' }, { value: 'youtube', label: 'YouTube' }, { value: 'vimeo', label: 'Vimeo' }]} />
      <TextInput label={block.content?.type === 'upload' ? 'File (Phase 1e)' : 'URL'} value={block.content?.src || ''} onChange={(v) => onUpdate({ ...block.content, src: v })} placeholder="https://…" />
      <Toggle label="Autoplay" checked={!!block.content?.autoplay} onChange={(v) => onUpdate({ ...block.content, autoplay: v })} />
      <Toggle label="Show controls" checked={block.content?.controls !== false} onChange={(v) => onUpdate({ ...block.content, controls: v })} />
      <TextInput label="Caption" value={block.content?.caption || ''} onChange={(v) => onUpdate({ ...block.content, caption: v })} placeholder="Optional caption" />
    </div>
  )
}

function AudioInspector({ block, onUpdate }: InspectorProps) {
  return (
    <div className="space-y-3">
      <div className="bg-[#141416] border border-dashed border-[#2A2A2E] rounded-lg p-4 text-center">
        <p className="text-[#555] text-xs">Media upload — Phase 1e</p>
      </div>
      <Toggle label="Autoplay" checked={!!block.content?.autoplay} onChange={(v) => onUpdate({ ...block.content, autoplay: v })} />
      <Toggle label="Show transcript" checked={block.content?.showTranscript !== false} onChange={(v) => onUpdate({ ...block.content, showTranscript: v })} />
      <SectionLabel>Transcript</SectionLabel>
      <TiptapEditor content={block.content?.transcript || ''} onChange={(v) => onUpdate({ ...block.content, transcript: v })} placeholder="Paste transcript here…" minHeight="80px" />
    </div>
  )
}

function QuoteInspector({ block, onUpdate }: InspectorProps) {
  return (
    <div className="space-y-3">
      <TiptapEditor content={block.content?.text || ''} onChange={(v) => onUpdate({ ...block.content, text: v })} placeholder="The quote text…" minHeight="80px" />
      <TextInput label="Author" value={block.content?.author || ''} onChange={(v) => onUpdate({ ...block.content, author: v })} placeholder="Author name" />
      <TextInput label="Attribution" value={block.content?.attribution || ''} onChange={(v) => onUpdate({ ...block.content, attribution: v })} placeholder="Role or source" />
      <Select label="Style" value={block.content?.style || 'standard'} onChange={(v) => onUpdate({ ...block.content, style: v })}
        options={[{ value: 'standard', label: 'Standard' }, { value: 'large', label: 'Large' }, { value: 'accent', label: 'Accent' }]} />
    </div>
  )
}

function CalloutInspector({ block, onUpdate }: InspectorProps) {
  return (
    <div className="space-y-3">
      <TextInput label="Icon (emoji)" value={block.content?.icon || '💡'} onChange={(v) => onUpdate({ ...block.content, icon: v })} placeholder="💡" />
      <TiptapEditor content={block.content?.html || ''} onChange={(v) => onUpdate({ ...block.content, html: v })} placeholder="Callout message…" minHeight="80px" />
      <ColorInput label="Background colour" value={block.content?.bgColor || '#1E1E3F'} onChange={(v) => onUpdate({ ...block.content, bgColor: v })} />
      <ColorInput label="Border colour" value={block.content?.borderColor || '#4F46E5'} onChange={(v) => onUpdate({ ...block.content, borderColor: v })} />
    </div>
  )
}

function CodeInspector({ block, onUpdate }: InspectorProps) {
  return (
    <div className="space-y-3">
      <Select label="Language" value={block.content?.language || 'javascript'} onChange={(v) => onUpdate({ ...block.content, language: v })}
        options={['javascript','typescript','python','html','css','sql','bash','json','yaml','markdown','rust','go','java','csharp'].map(l => ({ value: l, label: l }))} />
      <TextArea label="Code" value={block.content?.code || ''} onChange={(v) => onUpdate({ ...block.content, code: v })} placeholder="// Your code here" rows={8} />
      <Toggle label="Line numbers" checked={block.content?.showLineNumbers !== false} onChange={(v) => onUpdate({ ...block.content, showLineNumbers: v })} />
    </div>
  )
}

function DividerInspector({ block, onUpdate }: InspectorProps) {
  return (
    <div className="space-y-3">
      <Select label="Style" value={block.content?.style || 'solid'} onChange={(v) => onUpdate({ ...block.content, style: v })}
        options={[{ value: 'solid', label: 'Solid' }, { value: 'dashed', label: 'Dashed' }, { value: 'dotted', label: 'Dotted' }]} />
      <NumberInput label="Thickness (px)" value={block.content?.thickness || 1} onChange={(v) => onUpdate({ ...block.content, thickness: v })} min={1} max={8} />
      <ColorInput label="Colour" value={block.content?.color || '#2A2A2E'} onChange={(v) => onUpdate({ ...block.content, color: v })} />
    </div>
  )
}

function SpacerInspector({ block, onUpdate }: InspectorProps) {
  return (
    <NumberInput label="Height (px)" value={block.content?.height || 40} onChange={(v) => onUpdate({ ...block.content, height: v })} min={8} max={400} />
  )
}

function ButtonInspector({ block, onUpdate }: InspectorProps) {
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

function AccordionInspector({ block, onUpdate }: InspectorProps) {
  const items: Array<{ id: string; title: string; bodyHtml: string }> = block.content?.items || []

  function updateItem(index: number, field: string, value: string) {
    const updated = items.map((item, i) => i === index ? { ...item, [field]: value } : item)
    onUpdate({ ...block.content, items: updated })
  }

  function addItem() {
    const newItem = { id: crypto.randomUUID(), title: 'New item', bodyHtml: '' }
    onUpdate({ ...block.content, items: [...items, newItem] })
  }

  function removeItem(index: number) {
    onUpdate({ ...block.content, items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <Toggle label="Allow multiple open" checked={!!block.content?.allowMultiple} onChange={(v) => onUpdate({ ...block.content, allowMultiple: v })} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="bg-[#0F0F10] border border-[#2A2A2E] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#555] text-xs">Item {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-[#444] hover:text-red-400 text-xs transition-colors">Remove</button>
            </div>
            <TextInput label="Title" value={item.title} onChange={(v) => updateItem(i, 'title', v)} />
            <div>
              <Label>Body</Label>
              <TiptapEditor content={item.bodyHtml} onChange={(v) => updateItem(i, 'bodyHtml', v)} minHeight="60px" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem} className="w-full py-2 border border-dashed border-[#2A2A2E] rounded-lg text-[#555] hover:text-indigo-400 hover:border-indigo-500/50 text-xs transition-colors">
        + Add item
      </button>
    </div>
  )
}

function TabsInspector({ block, onUpdate }: InspectorProps) {
  const items: Array<{ id: string; label: string; bodyHtml: string }> = block.content?.items || []

  function updateItem(index: number, field: string, value: string) {
    onUpdate({ ...block.content, items: items.map((item, i) => i === index ? { ...item, [field]: value } : item) })
  }
  function addItem() {
    onUpdate({ ...block.content, items: [...items, { id: crypto.randomUUID(), label: 'New tab', bodyHtml: '' }] })
  }
  function removeItem(index: number) {
    onUpdate({ ...block.content, items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-3">
      <Select label="Orientation" value={block.content?.orientation || 'horizontal'} onChange={(v) => onUpdate({ ...block.content, orientation: v })}
        options={[{ value: 'horizontal', label: 'Horizontal' }, { value: 'vertical', label: 'Vertical' }]} />
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item.id} className="bg-[#0F0F10] border border-[#2A2A2E] rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[#555] text-xs">Tab {i + 1}</span>
              <button onClick={() => removeItem(i)} className="text-[#444] hover:text-red-400 text-xs transition-colors">Remove</button>
            </div>
            <TextInput label="Label" value={item.label} onChange={(v) => updateItem(i, 'label', v)} />
            <div>
              <Label>Content</Label>
              <TiptapEditor content={item.bodyHtml} onChange={(v) => updateItem(i, 'bodyHtml', v)} minHeight="60px" />
            </div>
          </div>
        ))}
      </div>
      <button onClick={addItem} className="w-full py-2 border border-dashed border-[#2A2A2E] rounded-lg text-[#555] hover:text-indigo-400 hover:border-indigo-500/50 text-xs transition-colors">
        + Add tab
      </button>
    </div>
  )
}

function ChecklistInspector({ block, onUpdate }: InspectorProps) {
  const items: Array<{ id: string; text: string; checkedByDefault: boolean }> = block.content?.items || []

  function updateItem(index: number, field: string, value: string | boolean) {
    onUpdate({ ...block.content, items: items.map((item, i) => i === index ? { ...item, [field]: value } : item) })
  }
  function addItem() {
    onUpdate({ ...block.content, items: [...items, { id: crypto.randomUUID(), text: '', checkedByDefault: false }] })
  }
  function removeItem(index: number) {
    onUpdate({ ...block.content, items: items.filter((_, i) => i !== index) })
  }

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={item.checkedByDefault}
            onChange={(e) => updateItem(i, 'checkedByDefault', e.target.checked)}
            className="accent-indigo-500"
            title="Default checked"
          />
          <input
            type="text"
            value={item.text}
            onChange={(e) => updateItem(i, 'text', e.target.value)}
            placeholder={`Item ${i + 1}`}
            className="flex-1 bg-[#0F0F10] border border-[#2A2A2E] rounded px-2 py-1.5 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button onClick={() => removeItem(i)} className="text-[#444] hover:text-red-400 transition-colors text-xs">×</button>
        </div>
      ))}
      <button onClick={addItem} className="w-full py-1.5 border border-dashed border-[#2A2A2E] rounded-lg text-[#555] hover:text-indigo-400 text-xs transition-colors">
        + Add item
      </button>
    </div>
  )
}

function EmbedInspector({ block, onUpdate }: InspectorProps) {
  return (
    <div className="space-y-3">
      <TextInput label="URL" value={block.content?.url || ''} onChange={(v) => onUpdate({ ...block.content, url: v })} placeholder="https://…" />
      <NumberInput label="Height (px)" value={block.content?.height || 400} onChange={(v) => onUpdate({ ...block.content, height: v })} min={100} max={2000} />
    </div>
  )
}

function StatementInspector({ block, onUpdate }: InspectorProps) {
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
      <p className="text-[#555] text-xs">
        Full inspector for <span className="text-[#888]">{block.type.replace(/_/g, ' ')}</span> coming in a future phase.
      </p>
    </div>
  )
}

// ── Settings panel ────────────────────────────────────────────────────────────

function SettingsPanel({ block, onUpdate }: { block: Block; onUpdate: (s: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <Select label="Spacing" value={block.settings?.spacing || 'normal'} onChange={(v) => onUpdate({ ...block.settings, spacing: v })}
        options={[{ value: 'compact', label: 'Compact' }, { value: 'normal', label: 'Normal' }, { value: 'loose', label: 'Loose' }]} />
    </div>
  )
}

// ── Main inspector ────────────────────────────────────────────────────────────

export default function BlockInspector({ block, onUpdateContent, onUpdateSettings }: Props) {
  if (!block) {
    return (
      <div className="w-64 bg-[#111113] border-l border-[#1E1E22] flex items-center justify-center flex-shrink-0">
        <p className="text-[#444] text-xs text-center px-4">Select a block to edit its settings</p>
      </div>
    )
  }

  const props = { block, onUpdate: onUpdateContent }

  const inspector = (() => {
    switch (block.type) {
      case 'text':           return <TextInspector {...props} />
      case 'image':          return <ImageInspector {...props} />
      case 'video':          return <VideoInspector {...props} />
      case 'audio':          return <AudioInspector {...props} />
      case 'quote':          return <QuoteInspector {...props} />
      case 'callout':        return <CalloutInspector {...props} />
      case 'code_block':     return <CodeInspector {...props} />
      case 'divider':        return <DividerInspector {...props} />
      case 'spacer':         return <SpacerInspector {...props} />
      case 'button':         return <ButtonInspector {...props} />
      case 'accordion':      return <AccordionInspector {...props} />
      case 'tabs':           return <TabsInspector {...props} />
      case 'checkbox_list':  return <ChecklistInspector {...props} />
      case 'embed':          return <EmbedInspector {...props} />
      case 'statement':      return <StatementInspector {...props} />
      default:               return <GenericInspector block={block} />
    }
  })()

  return (
    <div className="w-64 bg-[#111113] border-l border-[#1E1E22] flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-4 py-3 border-b border-[#1E1E22]">
        <span className="text-[#666] text-xs font-medium uppercase tracking-wider">
          {block.type.replace(/_/g, ' ')}
        </span>
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
