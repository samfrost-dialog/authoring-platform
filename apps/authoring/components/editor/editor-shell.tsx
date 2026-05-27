'use client'

import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/db/client'
import type { Course, Lesson, Block } from './types'
import EditorToolbar from './editor-toolbar'
import LessonOutline from './lesson-outline'
import BlockCanvas from './block-canvas'
import BlockInspector from './block-inspector'

interface Props {
  course: Course
  initialLessons: Lesson[]
  initialBlocks: Block[]
}

type SaveStatus = 'saved' | 'saving' | 'unsaved'

export default function EditorShell({ course, initialLessons, initialBlocks }: Props) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(
    initialLessons[0]?.id ?? null
  )
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [leftWidth, setLeftWidth] = useState(208)
  const [rightWidth, setRightWidth] = useState(256)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  // ── Debounced autosave ──────────────────────────────────────────────────────

  const scheduleSave = useCallback((fn: () => Promise<void>) => {
    setSaveStatus('unsaved')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      setSaveStatus('saving')
      await fn()
      setSaveStatus('saved')
    }, 1000)
  }, [])

  // ── Lesson operations ───────────────────────────────────────────────────────

  async function addLesson() {
    const position = lessons.length
    const { data, error } = await supabase
      .from('lessons')
      .insert({ course_id: course.id, title: 'New lesson', position })
      .select()
      .single()
    if (error || !data) return
    const newLesson = data as Lesson
    setLessons((prev) => [...prev, newLesson])
    setActiveLessonId(newLesson.id)
  }

  async function updateLessonTitle(lessonId: string, title: string) {
    setLessons((prev) => prev.map((l) => l.id === lessonId ? { ...l, title } : l))
    scheduleSave(async () => {
      await supabase.from('lessons').update({ title }).eq('id', lessonId)
    })
  }

  async function deleteLesson(lessonId: string) {
    await supabase.from('lessons').delete().eq('id', lessonId)
    setLessons((prev) => prev.filter((l) => l.id !== lessonId))
    setBlocks((prev) => prev.filter((b) => b.lesson_id !== lessonId))
    if (activeLessonId === lessonId) {
      const remaining = lessons.filter((l) => l.id !== lessonId)
      setActiveLessonId(remaining[0]?.id ?? null)
    }
  }

  async function reorderLessons(reordered: Lesson[]) {
    setLessons(reordered)
    scheduleSave(async () => {
      await Promise.all(
        reordered.map((l, i) =>
          supabase.from('lessons').update({ position: i }).eq('id', l.id)
        )
      )
    })
  }

  // ── Block operations ────────────────────────────────────────────────────────

  async function addBlock(lessonId: string, type: string, afterPosition?: number) {
    const lessonBlocks = blocks.filter((b) => b.lesson_id === lessonId)
    const position = afterPosition !== undefined ? afterPosition + 1 : lessonBlocks.length

    // Shift existing blocks down
    const toShift = lessonBlocks.filter((b) => b.position >= position)
    if (toShift.length) {
      await Promise.all(
        toShift.map((b) =>
          supabase.from('blocks').update({ position: b.position + 1 }).eq('id', b.id)
        )
      )
      setBlocks((prev) =>
        prev.map((b) =>
          b.lesson_id === lessonId && b.position >= position
            ? { ...b, position: b.position + 1 }
            : b
        )
      )
    }

    const { data, error } = await supabase
      .from('blocks')
      .insert({ lesson_id: lessonId, type, position, content: {}, settings: {} })
      .select()
      .single()
    if (error || !data) return
    const newBlock = data as Block
    setBlocks((prev) => [...prev, newBlock])
    setSelectedBlockId(newBlock.id)
  }

  async function updateBlock(blockId: string, content: Record<string, unknown>) {
    setBlocks((prev) =>
      prev.map((b) => b.id === blockId ? { ...b, content } : b)
    )
    scheduleSave(async () => {
      await supabase.from('blocks').update({ content }).eq('id', blockId)
    })
  }

  async function updateBlockSettings(blockId: string, settings: Record<string, unknown>) {
    setBlocks((prev) =>
      prev.map((b) => b.id === blockId ? { ...b, settings } : b)
    )
    scheduleSave(async () => {
      await supabase.from('blocks').update({ settings }).eq('id', blockId)
    })
  }

  async function deleteBlock(blockId: string) {
    await supabase.from('blocks').delete().eq('id', blockId)
    setBlocks((prev) => prev.filter((b) => b.id !== blockId))
    if (selectedBlockId === blockId) setSelectedBlockId(null)
  }

  async function reorderBlocks(lessonId: string, reordered: Block[]) {
    setBlocks((prev) => [
      ...prev.filter((b) => b.lesson_id !== lessonId),
      ...reordered,
    ])
    scheduleSave(async () => {
      await Promise.all(
        reordered.map((b, i) =>
          supabase.from('blocks').update({ position: i }).eq('id', b.id)
        )
      )
    })
  }

  // ── Derived state ───────────────────────────────────────────────────────────

  const activeLesson = lessons.find((l) => l.id === activeLessonId) ?? null
  const activeBlocks = blocks
    .filter((b) => b.lesson_id === activeLessonId)
    .sort((a, b) => a.position - b.position)
  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null

  function startDragLeft(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = leftWidth
    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX
      setLeftWidth(Math.max(160, Math.min(400, startW + delta)))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  function startDragRight(e: React.MouseEvent) {
    e.preventDefault()
    const startX = e.clientX
    const startW = rightWidth
    function onMove(ev: MouseEvent) {
      const delta = startX - ev.clientX
      setRightWidth(Math.max(200, Math.min(600, startW + delta)))
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div className="h-screen flex flex-col bg-[#0F0F10] overflow-hidden">
      {/* Top toolbar */}
      <EditorToolbar course={course} saveStatus={saveStatus} />

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left — lesson outline with draggable right border */}
        <div style={{ width: leftWidth, flexShrink: 0, position: 'relative' }} className="flex">
          <div style={{ width: '100%' }} className="overflow-hidden">
            <LessonOutline
              lessons={lessons}
              activeLessonId={activeLessonId}
              blocks={blocks}
              onSelectLesson={setActiveLessonId}
              onAddLesson={addLesson}
              onUpdateTitle={updateLessonTitle}
              onDeleteLesson={deleteLesson}
              onReorder={reorderLessons}
            />
          </div>
          {/* Right drag handle */}
          <div
            onMouseDown={startDragLeft}
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
            style={{ userSelect: 'none' }}
          />
        </div>

        {/* Centre — block canvas */}
        <BlockCanvas
          lesson={activeLesson}
          blocks={activeBlocks}
          selectedBlockId={selectedBlockId}
          onSelectBlock={setSelectedBlockId}
          onAddBlock={(type, afterPosition) =>
            activeLesson && addBlock(activeLesson.id, type, afterPosition)
          }
          onDeleteBlock={deleteBlock}
          onReorder={(reordered) =>
            activeLesson && reorderBlocks(activeLesson.id, reordered)
          }
        />

        {/* Right — block inspector with draggable left border */}
        <div style={{ width: rightWidth, flexShrink: 0, position: 'relative' }} className="flex">
          {/* Left drag handle */}
          <div
            onMouseDown={startDragRight}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500 transition-colors z-10"
            style={{ userSelect: 'none' }}
          />
          <div style={{ width: '100%' }} className="overflow-hidden">
            <BlockInspector
              block={selectedBlock}
              courseId={course.id}
              onUpdateContent={(content) =>
                selectedBlock && updateBlock(selectedBlock.id, content)
              }
              onUpdateSettings={(settings) =>
                selectedBlock && updateBlockSettings(selectedBlock.id, settings)
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}