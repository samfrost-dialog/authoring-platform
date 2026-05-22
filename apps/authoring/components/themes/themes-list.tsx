'use client'

import { useState } from 'react'
import type { Theme } from './theme-types'
import { DEFAULT_THEME } from './theme-types'
import ThemeEditor from './theme-editor'

interface Props {
  initialThemes: Theme[]
}

function ThemeCard({
  theme,
  onEdit,
  onDelete,
}: {
  theme: Theme
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="bg-[#141416] border border-[#1E1E22] rounded-xl overflow-hidden hover:border-[#2E2E36] transition-colors group">
      {/* Colour preview strip */}
      <div className="h-20 relative overflow-hidden" style={{ backgroundColor: theme.background_color || '#FFFFFF' }}>
        <div className="absolute inset-0 flex">
          <div className="flex-1" style={{ backgroundColor: theme.primary_color || '#4F46E5' }} />
          <div className="flex-1" style={{ backgroundColor: theme.secondary_color || '#7C3AED' }} />
          <div className="flex-1" style={{ backgroundColor: theme.accent_color || '#06B6D4' }} />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold" style={{ color: theme.primary_color || '#4F46E5', fontFamily: theme.heading_font || 'Inter' }}>
              Aa
            </span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-white text-sm font-medium">{theme.name}</h3>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="text-[#666] hover:text-indigo-400 p-1 transition-colors"
              title="Edit theme"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M9.5 1.5l2 2-7 7H2.5v-2l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="text-[#666] hover:text-red-400 p-1 transition-colors"
              title="Delete theme"
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 3h9M5 3V2h3v1M4 3l.5 7h4L9 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[theme.primary_color, theme.secondary_color, theme.accent_color].map((color, i) => (
            color && <div key={i} className="w-4 h-4 rounded-full border border-white/10" style={{ backgroundColor: color }} title={color} />
          ))}
          <span className="text-[#555] text-xs ml-auto">{theme.body_font || 'Inter'}</span>
        </div>
      </div>
    </div>
  )
}

export default function ThemesList({ initialThemes }: Props) {
  const [themes, setThemes] = useState<Theme[]>(initialThemes)
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  async function handleSave(data: Partial<Theme>) {
    if (editingTheme?.id) {
      const res = await fetch(`/api/themes/${editingTheme.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const updated = await res.json()
        setThemes((prev) => prev.map((t) => t.id === updated.id ? updated : t))
      }
    } else {
      const res = await fetch('/api/themes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        const created = await res.json()
        setThemes((prev) => [...prev, created])
      }
    }
    setEditingTheme(null)
    setIsCreating(false)
  }

  async function handleDelete(themeId: string) {
    if (!confirm('Delete this theme? This cannot be undone.')) return
    const res = await fetch(`/api/themes/${themeId}`, { method: 'DELETE' })
    if (res.ok) {
      setThemes((prev) => prev.filter((t) => t.id !== themeId))
    } else {
      const { error } = await res.json()
      alert(error || 'Failed to delete theme')
    }
  }

  const showEditor = isCreating || !!editingTheme

  return (
    <>
      {showEditor ? (
        <ThemeEditor
          theme={editingTheme ?? null}
          onSave={handleSave}
          onCancel={() => { setEditingTheme(null); setIsCreating(false) }}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* New theme card */}
            <button
              onClick={() => setIsCreating(true)}
              className="bg-[#141416] border border-dashed border-[#2A2A2E] rounded-xl h-40 flex flex-col items-center justify-center gap-2 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#1E1E22] group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1v12M1 7h12" stroke="#666" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-[#555] text-xs group-hover:text-indigo-400 transition-colors">New theme</span>
            </button>

            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                theme={theme}
                onEdit={() => setEditingTheme(theme)}
                onDelete={() => handleDelete(theme.id)}
              />
            ))}
          </div>

          {themes.length === 0 && (
            <div className="text-center py-12 mt-4">
              <p className="text-[#555] text-sm">No themes yet — create one to brand your courses</p>
            </div>
          )}
        </>
      )}
    </>
  )
}