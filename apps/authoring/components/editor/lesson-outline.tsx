'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Lesson, Block } from './types'

interface Props {
  lessons: Lesson[]
  activeLessonId: string | null
  blocks: Block[]
  onSelectLesson: (id: string) => void
  onAddLesson: () => void
  onUpdateTitle: (id: string, title: string) => void
  onDeleteLesson: (id: string) => void
  onReorder: (reordered: Lesson[]) => void
}

function SortableLesson({
  lesson,
  isActive,
  blockCount,
  onSelect,
  onUpdateTitle,
  onDelete,
}: {
  lesson: Lesson
  isActive: boolean
  blockCount: number
  onSelect: () => void
  onUpdateTitle: (title: string) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(lesson.title)
  const [showMenu, setShowMenu] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: lesson.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  function commitTitle() {
    setEditing(false)
    if (title.trim() && title !== lesson.title) {
      onUpdateTitle(title.trim())
    } else {
      setTitle(lesson.title)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors ${
        isActive ? 'bg-indigo-500/15' : 'hover:bg-white/5'
      }`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 text-[#444] hover:text-[#777] transition-opacity flex-shrink-0 cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="4" cy="3" r="1" fill="currentColor"/>
          <circle cx="8" cy="3" r="1" fill="currentColor"/>
          <circle cx="4" cy="6" r="1" fill="currentColor"/>
          <circle cx="8" cy="6" r="1" fill="currentColor"/>
          <circle cx="4" cy="9" r="1" fill="currentColor"/>
          <circle cx="8" cy="9" r="1" fill="currentColor"/>
        </svg>
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle()
              if (e.key === 'Escape') { setTitle(lesson.title); setEditing(false) }
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-transparent text-white text-xs outline-none border-b border-indigo-500"
          />
        ) : (
          <p className={`text-xs truncate ${isActive ? 'text-indigo-300' : 'text-[#888]'}`}>
            {lesson.title}
          </p>
        )}
        <p className="text-[10px] text-[#444] mt-0.5">{blockCount} block{blockCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Context menu */}
      <div className="relative flex-shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          className="opacity-0 group-hover:opacity-100 text-[#555] hover:text-[#999] transition-opacity p-0.5"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="2" r="1" fill="currentColor"/>
            <circle cx="6" cy="6" r="1" fill="currentColor"/>
            <circle cx="6" cy="10" r="1" fill="currentColor"/>
          </svg>
        </button>
        {showMenu && (
          <div className="absolute right-0 top-6 z-50 bg-[#1A1A1C] border border-[#2A2A2E] rounded-lg shadow-xl py-1 w-36">
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); setEditing(true) }}
              className="w-full text-left px-3 py-1.5 text-xs text-[#ccc] hover:bg-white/5 transition-colors"
            >
              Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete() }}
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-white/5 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LessonOutline({
  lessons,
  activeLessonId,
  blocks,
  onSelectLesson,
  onAddLesson,
  onUpdateTitle,
  onDeleteLesson,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = lessons.findIndex((l) => l.id === active.id)
    const newIndex = lessons.findIndex((l) => l.id === over.id)
    const reordered = arrayMove(lessons, oldIndex, newIndex).map((l, i) => ({
      ...l,
      position: i,
    }))
    onReorder(reordered)
  }

  return (
    <div className="w-52 flex flex-col bg-[#111113] border-r border-[#1E1E22] overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E22]">
        <span className="text-[#666] text-xs font-medium uppercase tracking-wider">Lessons</span>
        <button
          onClick={onAddLesson}
          className="text-[#555] hover:text-indigo-400 transition-colors"
          title="Add lesson"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Lesson list */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#444] text-xs">No lessons yet</p>
            <button
              onClick={onAddLesson}
              className="text-indigo-400 text-xs mt-1 hover:text-indigo-300 transition-colors"
            >
              Add first lesson
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={lessons.map((l) => l.id)}
              strategy={verticalListSortingStrategy}
            >
              {lessons.map((lesson) => (
                <SortableLesson
                  key={lesson.id}
                  lesson={lesson}
                  isActive={lesson.id === activeLessonId}
                  blockCount={blocks.filter((b) => b.lesson_id === lesson.id).length}
                  onSelect={() => onSelectLesson(lesson.id)}
                  onUpdateTitle={(title) => onUpdateTitle(lesson.id, title)}
                  onDelete={() => onDeleteLesson(lesson.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}
