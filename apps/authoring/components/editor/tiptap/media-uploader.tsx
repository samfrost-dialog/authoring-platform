'use client'

import { useRef, useState, useCallback } from 'react'
import { useMediaUpload, type UploadCategory } from './use-media-upload'

interface Props {
  courseId: string
  category: UploadCategory
  accept: string
  currentUrl?: string
  currentKey?: string
  onUpload: (key: string, publicUrl: string) => void
  onRemove?: () => void
  label?: string
  maxSizeMB?: number
}

export default function MediaUploader({
  courseId,
  category,
  accept,
  currentUrl,
  currentKey,
  onUpload,
  onRemove,
  label = 'file',
  maxSizeMB,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { uploading, progress, error, upload, reset } = useMediaUpload(courseId)

  const handleFile = useCallback(async (file: File) => {
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${maxSizeMB}MB.`)
      return
    }
    const result = await upload(file, category)
    if (result) onUpload(result.key, result.publicUrl)
  }, [upload, category, onUpload, maxSizeMB])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  // ── Already has a file ────────────────────────────────────────────────────

  if (currentUrl && !uploading) {
    return (
      <div className="space-y-2">
        {category === 'image' && (
          <div className="relative rounded-lg overflow-hidden bg-[#0F0F10] border border-[#2A2A2E]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={currentUrl} alt="Uploaded" className="w-full h-32 object-cover" />
          </div>
        )}
        {category === 'video' && (
          <video src={currentUrl} controls className="w-full rounded-lg border border-[#2A2A2E]" />
        )}
        {category === 'audio' && (
          <audio src={currentUrl} controls className="w-full" />
        )}
        {category === 'file' && (
          <div className="flex items-center gap-2 bg-[#141416] border border-[#2A2A2E] rounded-lg px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 1h6l3 3v9H3V1z" stroke="#666" strokeWidth="1.2"/>
              <path d="M9 1v3h3" stroke="#666" strokeWidth="1.2"/>
            </svg>
            <span className="text-[#888] text-xs truncate">{currentKey?.split('/').pop()}</span>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => inputRef.current?.click()}
            className="flex-1 py-1.5 text-xs text-[#666] hover:text-[#ccc] border border-[#2A2A2E] rounded-lg hover:bg-white/5 transition-colors"
          >
            Replace
          </button>
          {onRemove && (
            <button
              onClick={onRemove}
              className="flex-1 py-1.5 text-xs text-red-500 hover:text-red-400 border border-[#2A2A2E] rounded-lg hover:bg-white/5 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
      </div>
    )
  }

  // ── Upload in progress ────────────────────────────────────────────────────

  if (uploading) {
    return (
      <div className="bg-[#141416] border border-[#2A2A2E] rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#888] text-xs">Uploading…</span>
          <span className="text-[#666] text-xs">{progress}%</span>
        </div>
        <div className="h-1 bg-[#2A2A2E] rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  // ── Drop zone ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-[#2A2A2E] hover:border-[#3A3A3E] hover:bg-white/5'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mx-auto mb-2 text-[#555]">
          <path d="M10 3v10M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-[#666] text-xs">
          Drop {label} here or <span className="text-indigo-400">browse</span>
        </p>
        {maxSizeMB && (
          <p className="text-[#444] text-xs mt-1">Max {maxSizeMB}MB</p>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <span className="text-red-400 text-xs">{error}</span>
          <button onClick={reset} className="text-red-400 hover:text-red-300 text-xs">Dismiss</button>
        </div>
      )}

      <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={handleChange} />
    </div>
  )
}
