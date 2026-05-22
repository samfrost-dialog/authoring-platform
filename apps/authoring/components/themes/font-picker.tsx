'use client'

import { useState, useRef, useCallback } from 'react'

// Curated list of Google Fonts well-suited for e-learning
export const GOOGLE_FONTS = [
  // Sans-serif
  'Inter', 'DM Sans', 'Plus Jakarta Sans', 'Outfit', 'Figtree', 'Sora',
  'Space Grotesk', 'Nunito', 'Poppins', 'Montserrat', 'Raleway',
  'Open Sans', 'Lato', 'Roboto', 'Source Sans 3', 'Ubuntu', 'Noto Sans',
  'Work Sans', 'Mulish', 'Cabin', 'Josefin Sans', 'Quicksand',
  // Serif
  'Playfair Display', 'Merriweather', 'Lora', 'PT Serif',
  'Libre Baskerville', 'DM Serif Display', 'Cormorant Garamond',
  'EB Garamond', 'Spectral', 'Crimson Pro',
  // Monospace
  'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Space Mono',
]

interface Props {
  label: string
  value: string // either a Google Font name or an R2 key starting with "fonts/"
  onChange: (value: string, isCustom?: boolean) => void
}

export default function FontPicker({ label, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [tab, setTab] = useState<'google' | 'custom'>('google')
  const inputRef = useRef<HTMLInputElement>(null)

  const isCustom = value.startsWith('fonts/')
  const displayName = isCustom ? value.split('/').pop()?.replace(/\.[^.]+$/, '') ?? value : value

  const filtered = GOOGLE_FONTS.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase())
  )

  const handleCustomUpload = useCallback(async (file: File) => {
    setUploading(true)
    setUploadError(null)

    try {
      const signRes = await fetch('/api/fonts/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'font/woff2',
          fileSize: file.size,
        }),
      })

      if (!signRes.ok) {
        const { error } = await signRes.json()
        throw new Error(error || 'Failed to get upload URL')
      }

      const { uploadUrl, key } = await signRes.json()

      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'font/woff2' },
        body: file,
      })

      if (!uploadRes.ok) throw new Error('Upload failed')

      onChange(key, true)
      setOpen(false)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onChange])

  return (
    <div className="relative">
      <label className="block text-[10px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">
        {label}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors hover:border-[#3A3A3E]"
      >
        <span style={{ fontFamily: isCustom ? undefined : `'${value}', sans-serif` }}>
          {displayName || 'Select font…'}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-[#555] transition-transform ${open ? 'rotate-180' : ''}`}>
          <path d="M3 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#141416] border border-[#2A2A2E] rounded-xl shadow-2xl overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-[#2A2A2E]">
              <button
                onClick={() => setTab('google')}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === 'google' ? 'text-white border-b-2 border-indigo-500' : 'text-[#666] hover:text-[#ccc]'}`}
              >
                Google Fonts
              </button>
              <button
                onClick={() => setTab('custom')}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === 'custom' ? 'text-white border-b-2 border-indigo-500' : 'text-[#666] hover:text-[#ccc]'}`}
              >
                Custom upload
              </button>
            </div>

            {tab === 'google' ? (
              <>
                {/* Search */}
                <div className="p-2 border-b border-[#1E1E22]">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search fonts…"
                    autoFocus
                    className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-1.5 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Font list */}
                <div className="max-h-56 overflow-y-auto py-1">
                  {/* Load all fonts in preview */}
                  <style>{`@import url('https://fonts.googleapis.com/css2?${
                    filtered.slice(0, 20).map((f) => `family=${f.replace(/ /g, '+')}:wght@400;700`).join('&')
                  }&display=swap');`}</style>

                  {filtered.map((font) => (
                    <button
                      key={font}
                      onClick={() => { onChange(font, false); setOpen(false) }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/5 transition-colors ${value === font ? 'text-indigo-400' : 'text-[#ccc]'}`}
                    >
                      <span style={{ fontFamily: `'${font}', sans-serif` }}>{font}</span>
                      {value === font && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  ))}

                  {filtered.length === 0 && (
                    <p className="text-[#555] text-xs text-center py-4">No fonts match &ldquo;{search}&rdquo;</p>
                  )}
                </div>
              </>
            ) : (
              <div className="p-4 space-y-3">
                <p className="text-[#666] text-xs">Upload a .woff, .woff2, .ttf, or .otf file. It will be embedded in exported SCORM packages.</p>

                <div
                  onClick={() => inputRef.current?.click()}
                  className="border-2 border-dashed border-[#2A2A2E] hover:border-indigo-500/50 rounded-lg p-5 text-center cursor-pointer transition-colors hover:bg-white/5"
                >
                  {uploading ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      <span className="text-[#888] text-xs">Uploading…</span>
                    </div>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mx-auto mb-2 text-[#555]">
                        <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <p className="text-[#666] text-xs">Drop font file or <span className="text-indigo-400">browse</span></p>
                      <p className="text-[#444] text-xs mt-1">.woff2, .woff, .ttf, .otf — max 5MB</p>
                    </>
                  )}
                </div>

                {uploadError && (
                  <p className="text-red-400 text-xs">{uploadError}</p>
                )}

                {isCustom && (
                  <div className="flex items-center gap-2 bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-[#888] text-xs truncate">{displayName}</span>
                  </div>
                )}

                <input
                  ref={inputRef}
                  type="file"
                  accept=".woff,.woff2,.ttf,.otf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCustomUpload(file)
                    e.target.value = ''
                  }}
                />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}