'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Course } from './types'

interface Props {
  course: Course
  saveStatus: 'saved' | 'saving' | 'unsaved'
}

export default function EditorToolbar({ course, saveStatus }: Props) {
  const router = useRouter()

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
          className="flex items-center gap-1.5 text-[#666] hover:text-[#ccc] text-sm px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          title="Export SCORM (Phase 4)"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <path d="M6.5 1v7M4 6l2.5 2.5L9 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 10v1.5A1.5 1.5 0 002.5 13h8a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          Export
        </button>
      </div>
    </div>
  )
}