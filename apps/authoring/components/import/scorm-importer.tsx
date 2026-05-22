'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ImportState =
  | { phase: 'idle' }
  | { phase: 'uploading'; progress: number }
  | { phase: 'parsing' }
  | { phase: 'success'; courseId: string; courseTitle: string; lessonCount: number; blockCount: number; warnings: string[] }
  | { phase: 'error'; message: string }

export default function ScormImporter() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ImportState>({ phase: 'idle' })
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.zip')) {
      setState({ phase: 'error', message: 'Please upload a .zip SCORM package.' })
      return
    }

    if (file.size > 4 * 1024 * 1024) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1)
      setState({ phase: 'error', message: `File is ${sizeMB}MB — Vercel limits uploads to 4MB. Reduce your SCORM package size by compressing media files, or host videos externally (YouTube/Vimeo) and re-export from Rise.` })
      return
    }

    setState({ phase: 'uploading', progress: 0 })

    const formData = new FormData()
    formData.append('file', file)

    try {
      // Use XHR for upload progress
      const result = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/import/scorm')

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setState({ phase: 'uploading', progress: Math.round((e.loaded / e.total) * 100) })
          }
        })

        xhr.addEventListener('load', () => {
          resolve(new Response(xhr.responseText, { status: xhr.status }))
        })
        xhr.addEventListener('error', () => reject(new Error('Upload failed')))
        xhr.send(formData)
      })

      setState({ phase: 'parsing' })

      const data = await result.json()

      if (!result.ok) {
        setState({ phase: 'error', message: data.error || 'Import failed' })
        return
      }

      setState({
        phase:       'success',
        courseId:    data.courseId,
        courseTitle: data.courseTitle,
        lessonCount: data.lessonCount,
        blockCount:  data.blockCount,
        warnings:    data.warnings || [],
      })
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Import failed' })
    }
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  function reset() {
    setState({ phase: 'idle' })
    if (inputRef.current) inputRef.current.value = ''
  }

  // ── Success state ────────────────────────────────────────────────────────

  if (state.phase === 'success') {
    return (
      <div className="space-y-4">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 9l4 4 8-8" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-medium">{state.courseTitle}</h3>
              <p className="text-[#888] text-sm">{state.lessonCount} lesson{state.lessonCount !== 1 ? 's' : ''} · {state.blockCount} block{state.blockCount !== 1 ? 's' : ''} imported</p>
            </div>
          </div>

          {state.warnings.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
              <p className="text-yellow-400 text-xs font-medium mb-2">Import warnings ({state.warnings.length})</p>
              <ul className="space-y-1">
                {state.warnings.map((w, i) => (
                  <li key={i} className="text-yellow-300/80 text-xs">• {w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/editor/${state.courseId}`)}
              className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
            >
              Open in editor →
            </button>
            <button
              onClick={reset}
              className="px-4 py-2.5 border border-[#2A2A2E] text-[#888] hover:text-[#ccc] text-sm rounded-lg transition-colors"
            >
              Import another
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Uploading / parsing state ────────────────────────────────────────────

  if (state.phase === 'uploading' || state.phase === 'parsing') {
    return (
      <div className="bg-[#141416] border border-[#1E1E22] rounded-xl p-8 text-center">
        <svg className="animate-spin w-8 h-8 text-indigo-400 mx-auto mb-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-white text-sm font-medium mb-1">
          {state.phase === 'parsing' ? 'Parsing SCORM package…' : 'Uploading…'}
        </p>
        {state.phase === 'uploading' && (
          <>
            <p className="text-[#666] text-xs mb-3">{state.progress}%</p>
            <div className="h-1 bg-[#2A2A2E] rounded-full overflow-hidden max-w-xs mx-auto">
              <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${state.progress}%` }} />
            </div>
          </>
        )}
        {state.phase === 'parsing' && (
          <p className="text-[#666] text-xs">Mapping content to blocks…</p>
        )}
      </div>
    )
  }

  // ── Drop zone ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {state.phase === 'error' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-red-400 text-sm">{state.message}</span>
          <button onClick={reset} className="text-red-400 hover:text-red-300 text-xs ml-3">Dismiss</button>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
          dragging
            ? 'border-indigo-500 bg-indigo-500/5'
            : 'border-[#2A2A2E] hover:border-[#3A3A3E] hover:bg-white/5'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#1A1A1C] border border-[#2A2A2E] flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-[#555]">
            <path d="M12 3v12M7 8l5-5 5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 17v1.5A2.5 2.5 0 005.5 21h13a2.5 2.5 0 002.5-2.5V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <p className="text-white text-sm font-medium mb-1">
          Drop your SCORM package here
        </p>
        <p className="text-[#555] text-xs">
          or <span className="text-indigo-400">browse</span> to select a .zip file
        </p>
        <p className="text-[#444] text-xs mt-3">
          SCORM 1.2 · Rise Articulate exports · Max 500MB
        </p>
      </div>

      <div className="bg-[#141416] border border-[#1E1E22] rounded-xl p-4 space-y-2">
        <p className="text-[#666] text-xs font-medium uppercase tracking-wider">What gets imported</p>
        {[
          ['✓', 'Course structure (lessons and order)'],
          ['✓', 'Text, image, video, audio blocks'],
          ['✓', 'Accordion, tabs, process blocks (Rise)'],
          ['✓', 'Quotes, callouts, code blocks'],
          ['~', 'Quiz questions (structure only — rebuild answers)'],
          ['~', 'Branching scenarios (imported as static content)'],
          ['✗', 'Interactive JS widgets from non-Rise tools → raw HTML'],
        ].map(([icon, text]) => (
          <div key={text} className="flex items-center gap-2">
            <span className={`text-xs flex-shrink-0 ${icon === '✓' ? 'text-emerald-400' : icon === '~' ? 'text-yellow-400' : 'text-[#555]'}`}>{icon}</span>
            <span className="text-[#888] text-xs">{text}</span>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
    </div>
  )
}