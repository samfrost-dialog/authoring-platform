'use client'

import { useState } from 'react'
import type { Theme } from './theme-types'
import FontPicker from './font-picker'
import { DEFAULT_THEME } from './theme-types'
import ThemePreview from './theme-preview'

interface Props {
  theme: Theme | null
  onSave: (data: Partial<Theme>) => Promise<void>
  onCancel: () => void
}

// ── Field components ──────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">{children}</label>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-[#1E1E22] pb-6 mb-6 last:border-0 last:mb-0 last:pb-0">
      <h3 className="text-white text-xs font-semibold uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 items-center">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
          className="w-9 h-9 rounded-lg cursor-pointer border border-[#2A2A2E] bg-transparent p-0.5" />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000"
          className="flex-1 bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors font-mono" />
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors" />
    </div>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
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

// ── Main editor ───────────────────────────────────────────────────────────────

export default function ThemeEditor({ theme, onSave, onCancel }: Props) {
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<Partial<Theme>>({
    name: theme?.name ?? DEFAULT_THEME.name,
    primary_color: theme?.primary_color ?? DEFAULT_THEME.primary_color,
    secondary_color: theme?.secondary_color ?? DEFAULT_THEME.secondary_color,
    accent_color: theme?.accent_color ?? DEFAULT_THEME.accent_color,
    background_color: theme?.background_color ?? DEFAULT_THEME.background_color,
    text_color: theme?.text_color ?? DEFAULT_THEME.text_color,
    heading_font: theme?.heading_font ?? DEFAULT_THEME.heading_font,
    body_font: theme?.body_font ?? DEFAULT_THEME.body_font,
    button_style: theme?.button_style ?? DEFAULT_THEME.button_style,
    cover_style: theme?.cover_style ?? DEFAULT_THEME.cover_style,
    custom_css: theme?.custom_css ?? '',
  })

  function set<K extends keyof Theme>(key: K, value: Theme[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  function setButtonStyle(field: string, value: string | boolean) {
    setData((prev) => ({
      ...prev,
      button_style: { ...(prev.button_style ?? DEFAULT_THEME.button_style!), [field]: value },
    }))
  }

  async function handleSave() {
    setSaving(true)
    await onSave(data)
    setSaving(false)
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-10rem)]">
      {/* Settings panel */}
      <div className="w-80 flex-shrink-0 flex flex-col bg-[#111113] border border-[#1E1E22] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1E1E22]">
          <h2 className="text-white font-semibold text-sm">{theme ? 'Edit theme' : 'New theme'}</h2>
          <div className="flex gap-2">
            <button onClick={onCancel} className="text-[#666] hover:text-[#ccc] text-xs px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving}
              className="bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-md transition-colors">
              {saving ? 'Saving…' : 'Save theme'}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <Section title="Name">
            <TextField label="Theme name" value={data.name || ''} onChange={(v) => set('name', v)} placeholder="e.g. Dialog Brand" />
          </Section>

          <Section title="Colours">
            <div className="grid grid-cols-2 gap-3">
              <ColorField label="Primary" value={data.primary_color || ''} onChange={(v) => set('primary_color', v)} />
              <ColorField label="Secondary" value={data.secondary_color || ''} onChange={(v) => set('secondary_color', v)} />
              <ColorField label="Accent" value={data.accent_color || ''} onChange={(v) => set('accent_color', v)} />
              <ColorField label="Background" value={data.background_color || ''} onChange={(v) => set('background_color', v)} />
            </div>
            <ColorField label="Body text" value={data.text_color || ''} onChange={(v) => set('text_color', v)} />
          </Section>

          <Section title="Typography">
            <FontPicker label="Heading font" value={data.heading_font || 'Inter'} onChange={(v) => set('heading_font', v)} />
            <FontPicker label="Body font" value={data.body_font || 'Inter'} onChange={(v) => set('body_font', v)} />
          </Section>

          <Section title="Buttons">
            <SelectField label="Corner radius" value={data.button_style?.borderRadius || '0.375rem'} onChange={(v) => setButtonStyle('borderRadius', v)}
              options={[
                { value: '0', label: 'Square' },
                { value: '0.25rem', label: 'Slightly rounded' },
                { value: '0.375rem', label: 'Rounded (default)' },
                { value: '0.5rem', label: 'More rounded' },
                { value: '9999px', label: 'Pill' },
              ]} />
            <SelectField label="Padding" value={data.button_style?.padding || 'regular'} onChange={(v) => setButtonStyle('padding', v)}
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'regular', label: 'Regular' },
                { value: 'large', label: 'Large' },
              ]} />
            <Toggle label="Shadow" checked={!!data.button_style?.shadow} onChange={(v) => setButtonStyle('shadow', v)} />
          </Section>

          <Section title="Cover style">
            <SelectField label="Default cover" value={data.cover_style || 'gradient'} onChange={(v) => set('cover_style', v as Theme['cover_style'])}
              options={[
                { value: 'gradient', label: 'Gradient' },
                { value: 'solid', label: 'Solid colour' },
                { value: 'image', label: 'Image' },
              ]} />
          </Section>
        </div>
      </div>

      {/* Live preview */}
      <div className="flex-1 flex flex-col">
        <p className="text-[#555] text-xs mb-3">Live preview</p>
        <div className="flex-1 rounded-xl overflow-hidden border border-[#1E1E22] bg-white">
          <ThemePreview theme={data} />
        </div>
      </div>
    </div>
  )
}