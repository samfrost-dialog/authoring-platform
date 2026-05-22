'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Course } from './types'

interface Props {
  course: Course
  saveStatus: 'saved' | 'saving' | 'unsaved'
}

interface Theme {
  id: string
  name: string
  primary_color: string | null
}

export default function EditorToolbar({ course, saveStatus }: Props) {
  const router = useRouter()
  const [themes, setThemes] = useState<Theme[]>([])
  const [currentThemeId, setCurrentThemeId] = useState<string | null>(course.theme_id)
  const [themeOpen, setThemeOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/themes')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setThemes(data))
      .catch(() => {})
  }, [])

  async function handleThemeChange(themeId: string | null) {
    setCurrentThemeId(themeId)
    setThemeOpen(false)
    await fetch(`/api/courses/${course.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme_id: themeId }),
    })
  }

  const currentTheme = themes.find((t) => t.id === currentThemeId)

  async function handleExport() {
    setExporting(true)
    setExportError(null)
    try {
      const res = await fetch(`/api/courses/${course.id}/export`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Export failed')
      // Trigger download
      const a = document.createElement('a')
      a.href = data.downloadUrl
      a.download = data.filename
      a.click()
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="h-12 flex items-center justify-between px-4 bg-[#111113] border-b border-[#1E1E22] flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <Link href="/dashboard" className="text-[#555] hover:text-[#999] transition-colors flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="w-px h-4 bg-[#2A2A2E] flex-shrink-0" />
        <span className="text-white text-sm font-medium truncate">{course.title}</span>

        {/* Save indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {saveStatus === 'saving' && (
            <>
              <svg className="animate-spin w-3 h-3 text-[#666]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <span className="text-[#666] text-xs">Saving…</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 5l2 2 4-4" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-[#4ade80] text-xs">Saved</span>
            </>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-[#888] text-xs">Unsaved changes</span>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          course.status === 'published' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#2A2A2E] text-[#888]'
        }`}>
          {course.status}
        </span>

        {/* Theme picker */}
        <div className="relative">
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="flex items-center gap-1.5 text-[#666] hover:text-[#ccc] text-xs px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          >
            {currentTheme?.primary_color && (
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: currentTheme.primary_color }} />
            )}
            <span>{currentTheme?.name || 'No theme'}</span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`transition-transform ${themeOpen ? 'rotate-180' : ''}`}>
              <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {themeOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-50 bg-[#141416] border border-[#2A2A2E] rounded-xl shadow-2xl py-1 w-48">
                <button
                  onClick={() => handleThemeChange(null)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/5 ${!currentThemeId ? 'text-indigo-400' : 'text-[#888]'}`}
                >
                  <div className="w-3 h-3 rounded-full bg-[#2A2A2E] flex-shrink-0" />
                  No theme
                  {!currentThemeId && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto">
                      <path d="M2 5l2 2 4-4" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeChange(theme.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/5 ${theme.id === currentThemeId ? 'text-indigo-400' : 'text-[#ccc]'}`}
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: theme.primary_color || '#4F46E5' }} />
                    <span className="truncate">{theme.name}</span>
                    {theme.id === currentThemeId && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="ml-auto flex-shrink-0">
                        <path d="M2 5l2 2 4-4" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                ))}
                <div className="border-t border-[#1E1E22] mt-1 pt-1">
                  <button
                    onClick={() => { setThemeOpen(false); router.push('/dashboard/themes') }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#555] hover:text-indigo-400 hover:bg-white/5 transition-colors"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    </svg>
                    Manage themes
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={() => router.push(`/preview/${course.id}`)}
          className="flex items-center gap-1.5 text-[#666] hover:text-[#ccc] text-sm px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M1 6.5C1 6.5 3 2 6.5 2S12 6.5 12 6.5 10 11 6.5 11 1 6.5 1 6.5z" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="6.5" cy="6.5" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
          </svg>
          Preview
        </button>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 text-[#666] hover:text-[#ccc] disabled:opacity-50 text-sm px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          title="Export SCORM 1.2"
        >
          {exporting ? (
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 10v1.5A1.5 1.5 0 002.5 13h8a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          )}
          {exporting ? 'Exporting…' : 'Export'}
        </button>
        {exportError && (
          <span className="text-red-400 text-xs">{exportError}</span>
        )}
      </div>
    </div>
  )
}