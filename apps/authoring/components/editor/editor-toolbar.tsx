'use client'

import Link from 'next/link'
import type { Course } from './types'

interface Props {
  course: Course
  saveStatus: 'saved' | 'saving' | 'unsaved'
}

const SAVE_LABELS = {
  saved:   { text: 'Saved',   color: 'text-[#4ade80]' },
  saving:  { text: 'Saving…', color: 'text-[#888]' },
  unsaved: { text: 'Unsaved', color: 'text-[#888]' },
}

export default function EditorToolbar({ course, saveStatus }: Props) {
  const save = SAVE_LABELS[saveStatus]

  return (
    <div className="h-12 flex items-center justify-between px-4 bg-[#111113] border-b border-[#1E1E22] flex-shrink-0">
      {/* Left — back + course title */}
      <div className="flex items-center gap-3 min-w-0">
        <Link
          href="/dashboard"
          className="text-[#555] hover:text-[#999] transition-colors flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
        <div className="w-px h-4 bg-[#2A2A2E] flex-shrink-0" />
        <span className="text-white text-sm font-medium truncate">{course.title}</span>
        <span className={`text-xs flex-shrink-0 ${save.color}`}>{save.text}</span>
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className={`text-xs px-2 py-0.5 rounded-full ${
          course.status === 'published'
            ? 'bg-emerald-500/15 text-emerald-400'
            : 'bg-[#2A2A2E] text-[#888]'
        }`}>
          {course.status}
        </span>

        <button
          className="text-[#666] hover:text-[#ccc] text-sm px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          title="Preview (coming soon)"
        >
          Preview
        </button>

        <button
          className="text-[#666] hover:text-[#ccc] text-sm px-3 py-1.5 rounded-md hover:bg-white/5 transition-colors"
          title="Export SCORM (Phase 4)"
        >
          Export
        </button>
      </div>
    </div>
  )
}
