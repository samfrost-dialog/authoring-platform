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
import BlockRenderer from './block-renderer'

// ── Block palette categories ──────────────────────────────────────────────────

const BLOCK_PALETTE = [
  {
    category: 'Text & Media',
    blocks: [
      { type: 'text',          label: 'Text',          icon: '¶' },
      { type: 'image',         label: 'Image',         icon: '🖼' },
      { type: 'video',         label: 'Video',         icon: '▶' },
      { type: 'audio',         label: 'Audio',         icon: '♪' },
      { type: 'quote',         label: 'Quote',         icon: '"' },
      { type: 'callout',       label: 'Callout',       icon: '!' },
      { type: 'code_block',    label: 'Code',          icon: '</>' },
      { type: 'file_download', label: 'File Download', icon: '↓' },
      { type: 'embed',         label: 'Embed',         icon: '⊞' },
      { type: 'divider',       label: 'Divider',       icon: '—' },
      { type: 'spacer',        label: 'Spacer',        icon: '⬜' },
      { type: 'chart',         label: 'Chart',         icon: '📊' },
      { type: 'annotated_image', label: 'Annotated Image', icon: '📍' },
    ],
  },
  {
    category: 'Interactive',
    blocks: [
      { type: 'accordion',        label: 'Accordion',       icon: '≡' },
      { type: 'tabs',             label: 'Tabs',            icon: '⊟' },
      { type: 'process',          label: 'Process',         icon: '→' },
      { type: 'timeline',         label: 'Timeline',        icon: '⊶' },
      { type: 'flashcards',       label: 'Flashcards',      icon: '⧉' },
      { type: 'flip_cards',       label: 'Flip Cards',      icon: '⟳' },
      { type: 'hotspot',          label: 'Hotspot',         icon: '+' },
      { type: 'labeled_graphic',  label: 'Labeled Graphic', icon: '🏷' },
      { type: 'gallery',          label: 'Gallery',         icon: '⊞' },
      { type: 'carousel',         label: 'Carousel',        icon: '◁▷' },
      { type: 'sorting_activity', label: 'Sorting',         icon: '⇅' },
      { type: 'drag_drop',        label: 'Drag & Drop',     icon: '⤢' },
    ],
  },
  {
    category: 'Layout',
    blocks: [
      { type: 'columns',       label: 'Columns',       icon: '⫴' },
      { type: 'sidebar',       label: 'Sidebar',       icon: '▏' },
      { type: 'statement',     label: 'Statement',     icon: '❝' },
      { type: 'button',        label: 'Button',        icon: '⬭' },
      { type: 'button_stack',  label: 'Button Stack',  icon: '⬭⬭' },
      { type: 'checkbox_list', label: 'Checklist',     icon: '☑' },
      { type: 'numbered_list', label: 'Numbered List', icon: '1.' },
      { type: 'continue',      label: 'Continue',      icon: '▶' },
      { type: 'certificate',   label: 'Certificate',   icon: '🎓' },
    ],
  },
  {
    category: 'Questions',
    blocks: [
      { type: 'quiz',            label: 'Quiz',            icon: '?' },
      { type: 'knowledge_check', label: 'Knowledge Check', icon: '✓' },
      { type: 'survey',          label: 'Survey',          icon: '📋' },
      { type: 'scenario',        label: 'Branching',       icon: '⑂' },
    ],
  },
]

// ── Add block button (shown between blocks) ───────────────────────────────────

function AddBlockButton({
  afterPosition,
  onAdd,
}: {
  afterPosition: number
  onAdd: (type: string, afterPosition: number) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative group/add flex items-center justify-center my-1">
      <button
        onClick={() => setOpen(!open)}
        className="opacity-0 group-hover/add:opacity-100 flex items-center gap-1.5 text-xs text-[#555] hover:text-indigo-400 transition-all bg-[#141416] border border-[#2A2A2E] hover:border-indigo-500/50 rounded-full px-3 py-1"
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        Add block
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-[#141416] border border-[#2A2A2E] rounded-xl shadow-2xl p-3 w-80 max-h-96 overflow-y-auto">
            {BLOCK_PALETTE.map((cat) => (
              <div key={cat.category} className="mb-3 last:mb-0">
                <p className="text-[10px] text-[#555] uppercase tracking-wider px-1 mb-1.5">
                  {cat.category}
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {cat.blocks.map((b) => (
                    <button
                      key={b.type}
                      onClick={() => { setOpen(false); onAdd(b.type, afterPosition) }}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg text-[#888] hover:text-white hover:bg-white/5 transition-colors text-center"
                    >
                      <span className="text-base leading-none">{b.icon}</span>
                      <span className="text-[10px] leading-tight">{b.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── Sortable block wrapper ────────────────────────────────────────────────────

function SortableBlock({
  block,
  isSelected,
  onSelect,
  onDelete,
  onAdd,
}: {
  block: Block
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
  onAdd: (type: string, afterPosition: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        onClick={onSelect}
        className={`group/block relative rounded-lg border transition-colors cursor-pointer ${
          isSelected
            ? 'border-indigo-500/50 bg-indigo-500/5'
            : 'border-transparent hover:border-[#2A2A2E]'
        }`}
      >
        {/* Block controls */}
        <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="text-[#444] hover:text-[#888] cursor-grab active:cursor-grabbing p-1"
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
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="absolute -right-7 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity text-[#444] hover:text-red-400 p-1"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Block content */}
        <div className="p-3">
          <BlockRenderer block={block} />
        </div>
      </div>

      {/* Add block button after this block */}
      <AddBlockButton afterPosition={block.position} onAdd={onAdd} />
    </div>
  )
}

// ── Main canvas ───────────────────────────────────────────────────────────────

interface Props {
  lesson: Lesson | null
  blocks: Block[]
  selectedBlockId: string | null
  onSelectBlock: (id: string) => void
  onAddBlock: (type: string, afterPosition?: number) => void
  onDeleteBlock: (id: string) => void
  onReorder: (reordered: Block[]) => void
}

export default function BlockCanvas({
  lesson,
  blocks,
  selectedBlockId,
  onSelectBlock,
  onAddBlock,
  onDeleteBlock,
  onReorder,
}: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex((b) => b.id === active.id)
    const newIndex = blocks.findIndex((b) => b.id === over.id)
    const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
      ...b,
      position: i,
    }))
    onReorder(reordered)
  }

  if (!lesson) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[#444] text-sm">Select a lesson to start editing</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0F0F10]">
      <div className="max-w-2xl mx-auto px-12 py-8">
        {/* Lesson title */}
        <h2 className="text-white text-xl font-semibold mb-6">{lesson.title}</h2>

        {/* Blocks */}
        <div className="relative pl-8">
          {/* First add button */}
          <AddBlockButton afterPosition={-1} onAdd={onAddBlock} />

          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-xl bg-[#141416] border border-[#1E1E22] flex items-center justify-center mb-3">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="#444" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <p className="text-[#444] text-sm">Click + to add your first block</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={blocks.map((b) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                {blocks.map((block) => (
                  <SortableBlock
                    key={block.id}
                    block={block}
                    isSelected={block.id === selectedBlockId}
                    onSelect={() => onSelectBlock(block.id)}
                    onDelete={() => onDeleteBlock(block.id)}
                    onAdd={onAddBlock}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  )
}
