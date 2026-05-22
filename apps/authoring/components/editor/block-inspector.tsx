'use client'

import type { Block } from './types'

interface Props {
  block: Block | null
  onUpdateContent: (content: Record<string, unknown>) => void
  onUpdateSettings: (settings: Record<string, unknown>) => void
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  multiline?: boolean
  placeholder?: string
}) {
  const base = "w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors"
  return (
    <div>
      <label className="block text-[10px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
    </div>
  )
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

// ── Block-specific inspector panels ──────────────────────────────────────────

function TextInspector({ block, onUpdate }: { block: Block; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <TextField
        label="Content (HTML)"
        value={block.content?.html || ''}
        onChange={(v) => onUpdate({ ...block.content, html: v })}
        multiline
        placeholder="<p>Your text here</p>"
      />
      <p className="text-[#444] text-xs">Full rich text editor coming in Phase 1d</p>
    </div>
  )
}

function ImageInspector({ block, onUpdate }: { block: Block; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <TextField
        label="Alt text"
        value={block.content?.alt || ''}
        onChange={(v) => onUpdate({ ...block.content, alt: v })}
        placeholder="Describe the image"
      />
      <TextField
        label="Caption"
        value={block.content?.caption || ''}
        onChange={(v) => onUpdate({ ...block.content, caption: v })}
        placeholder="Optional caption"
      />
      <SelectField
        label="Alignment"
        value={block.content?.alignment || 'center'}
        onChange={(v) => onUpdate({ ...block.content, alignment: v })}
        options={[
          { value: 'left', label: 'Left' },
          { value: 'center', label: 'Center' },
          { value: 'right', label: 'Right' },
        ]}
      />
      <div className="bg-[#141416] border border-dashed border-[#2A2A2E] rounded-lg p-4 text-center">
        <p className="text-[#555] text-xs">R2 media upload coming in Phase 1e</p>
      </div>
    </div>
  )
}

function QuoteInspector({ block, onUpdate }: { block: Block; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <TextField
        label="Quote text"
        value={block.content?.text || ''}
        onChange={(v) => onUpdate({ ...block.content, text: v })}
        multiline
        placeholder="The quote text…"
      />
      <TextField
        label="Author"
        value={block.content?.author || ''}
        onChange={(v) => onUpdate({ ...block.content, author: v })}
        placeholder="Author name"
      />
      <SelectField
        label="Style"
        value={block.content?.style || 'standard'}
        onChange={(v) => onUpdate({ ...block.content, style: v })}
        options={[
          { value: 'standard', label: 'Standard' },
          { value: 'large', label: 'Large' },
          { value: 'accent', label: 'Accent' },
        ]}
      />
    </div>
  )
}

function CalloutInspector({ block, onUpdate }: { block: Block; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <TextField
        label="Icon"
        value={block.content?.icon || '💡'}
        onChange={(v) => onUpdate({ ...block.content, icon: v })}
        placeholder="💡"
      />
      <TextField
        label="Content (HTML)"
        value={block.content?.html || ''}
        onChange={(v) => onUpdate({ ...block.content, html: v })}
        multiline
        placeholder="Callout text…"
      />
    </div>
  )
}

function CodeInspector({ block, onUpdate }: { block: Block; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <SelectField
        label="Language"
        value={block.content?.language || 'javascript'}
        onChange={(v) => onUpdate({ ...block.content, language: v })}
        options={[
          { value: 'javascript', label: 'JavaScript' },
          { value: 'typescript', label: 'TypeScript' },
          { value: 'python', label: 'Python' },
          { value: 'html', label: 'HTML' },
          { value: 'css', label: 'CSS' },
          { value: 'sql', label: 'SQL' },
          { value: 'bash', label: 'Bash' },
          { value: 'json', label: 'JSON' },
        ]}
      />
      <TextField
        label="Code"
        value={block.content?.code || ''}
        onChange={(v) => onUpdate({ ...block.content, code: v })}
        multiline
        placeholder="// Your code here"
      />
    </div>
  )
}

function ButtonInspector({ block, onUpdate }: { block: Block; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <TextField
        label="Label"
        value={block.content?.label || ''}
        onChange={(v) => onUpdate({ ...block.content, label: v })}
        placeholder="Button text"
      />
      <TextField
        label="URL"
        value={block.content?.url || ''}
        onChange={(v) => onUpdate({ ...block.content, url: v })}
        placeholder="https://…"
      />
      <SelectField
        label="Style"
        value={block.content?.style || 'primary'}
        onChange={(v) => onUpdate({ ...block.content, style: v })}
        options={[
          { value: 'primary', label: 'Primary' },
          { value: 'secondary', label: 'Secondary' },
          { value: 'outline', label: 'Outline' },
          { value: 'ghost', label: 'Ghost' },
        ]}
      />
    </div>
  )
}

function SpacerInspector({ block, onUpdate }: { block: Block; onUpdate: (c: Record<string, unknown>) => void }) {
  return (
    <div>
      <label className="block text-[10px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">
        Height (px)
      </label>
      <input
        type="number"
        min={8}
        max={400}
        value={block.content?.height || 40}
        onChange={(e) => onUpdate({ ...block.content, height: parseInt(e.target.value) })}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
      />
    </div>
  )
}

function GenericInspector({ block }: { block: Block }) {
  return (
    <div className="bg-[#141416] border border-[#1E1E22] rounded-lg p-3">
      <p className="text-[#555] text-xs">
        Full inspector for <span className="text-[#888]">{block.type}</span> coming in Phase 1d.
      </p>
    </div>
  )
}

// ── Settings panel (shared) ───────────────────────────────────────────────────

function SettingsPanel({ block, onUpdate }: { block: Block; onUpdate: (s: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-3">
      <SelectField
        label="Spacing"
        value={block.settings?.spacing || 'normal'}
        onChange={(v) => onUpdate({ ...block.settings, spacing: v })}
        options={[
          { value: 'compact', label: 'Compact' },
          { value: 'normal', label: 'Normal' },
          { value: 'loose', label: 'Loose' },
        ]}
      />
    </div>
  )
}

// ── Main inspector ────────────────────────────────────────────────────────────

export default function BlockInspector({ block, onUpdateContent, onUpdateSettings }: Props) {
  if (!block) {
    return (
      <div className="w-64 bg-[#111113] border-l border-[#1E1E22] flex items-center justify-center flex-shrink-0">
        <p className="text-[#444] text-xs text-center px-4">
          Select a block to edit its settings
        </p>
      </div>
    )
  }

  const inspectorProps = { block, onUpdate: onUpdateContent }

  const inspector = (() => {
    switch (block.type) {
      case 'text':      return <TextInspector {...inspectorProps} />
      case 'image':     return <ImageInspector {...inspectorProps} />
      case 'quote':     return <QuoteInspector {...inspectorProps} />
      case 'callout':   return <CalloutInspector {...inspectorProps} />
      case 'code_block': return <CodeInspector {...inspectorProps} />
      case 'button':    return <ButtonInspector {...inspectorProps} />
      case 'spacer':    return <SpacerInspector {...inspectorProps} />
      default:          return <GenericInspector block={block} />
    }
  })()

  return (
    <div className="w-64 bg-[#111113] border-l border-[#1E1E22] flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1E1E22] flex items-center justify-between">
        <span className="text-[#666] text-xs font-medium uppercase tracking-wider">
          {block.type.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Content settings */}
        <div className="p-4 border-b border-[#1E1E22]">
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-3">Content</p>
          {inspector}
        </div>

        {/* Layout settings */}
        <div className="p-4">
          <p className="text-[10px] text-[#555] uppercase tracking-wider mb-3">Layout</p>
          <SettingsPanel block={block} onUpdate={onUpdateSettings} />
        </div>
      </div>
    </div>
  )
}
