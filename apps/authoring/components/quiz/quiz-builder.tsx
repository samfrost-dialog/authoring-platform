'use client'

import { useState } from 'react'
import type { Question, QuizContent, QuestionType } from './quiz-types'
import { QUESTION_TYPE_LABELS, makeQuestion } from './quiz-types'

interface Props {
  content: Partial<QuizContent>
  onChange: (content: QuizContent) => void
  isKnowledgeCheck?: boolean
}

// ── Shared field helpers ──────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-medium text-[#666] mb-1.5 uppercase tracking-wider">{children}</label>
}

function Input({ value, onChange, placeholder, className = '' }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className={`bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors ${className}`} />
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-medium text-[#666] uppercase tracking-wider">{label}</span>
      <button onClick={() => onChange(!checked)} className={`w-8 h-4 rounded-full transition-colors relative ${checked ? 'bg-indigo-500' : 'bg-[#2A2A2E]'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

// ── Question type editors ─────────────────────────────────────────────────────

function MultipleChoiceEditor({ q, onChange }: { q: Question & { type: 'multiple_choice' }; onChange: (q: Question) => void }) {
  function addOption() {
    onChange({ ...q, options: [...q.options, { id: crypto.randomUUID(), text: '' }] })
  }
  function updateOption(id: string, text: string) {
    onChange({ ...q, options: q.options.map((o) => o.id === id ? { ...o, text } : o) })
  }
  function removeOption(id: string) {
    onChange({ ...q, options: q.options.filter((o) => o.id !== id), correctId: q.correctId === id ? '' : q.correctId })
  }
  return (
    <div className="space-y-2">
      <Label>Options (select correct answer)</Label>
      {q.options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2">
          <button onClick={() => onChange({ ...q, correctId: opt.id })}
            className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${opt.id === q.correctId ? 'bg-indigo-500 border-indigo-500' : 'border-[#444] hover:border-indigo-400'}`} />
          <Input value={opt.text} onChange={(v) => updateOption(opt.id, v)} placeholder="Option text" className="flex-1" />
          <button onClick={() => removeOption(opt.id)} className="text-[#444] hover:text-red-400 transition-colors text-xs px-1">×</button>
        </div>
      ))}
      <button onClick={addOption} className="text-indigo-400 hover:text-indigo-300 text-xs transition-colors">+ Add option</button>
    </div>
  )
}

function MultipleSelectEditor({ q, onChange }: { q: Question & { type: 'multiple_select' }; onChange: (q: Question) => void }) {
  function addOption() {
    onChange({ ...q, options: [...q.options, { id: crypto.randomUUID(), text: '' }] })
  }
  function toggleCorrect(id: string) {
    const ids = q.correctIds.includes(id) ? q.correctIds.filter((x) => x !== id) : [...q.correctIds, id]
    onChange({ ...q, correctIds: ids })
  }
  return (
    <div className="space-y-2">
      <Label>Options (check all correct answers)</Label>
      {q.options.map((opt) => (
        <div key={opt.id} className="flex items-center gap-2">
          <button onClick={() => toggleCorrect(opt.id)}
            className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${q.correctIds.includes(opt.id) ? 'bg-indigo-500 border-indigo-500' : 'border-[#444] hover:border-indigo-400'}`}>
            {q.correctIds.includes(opt.id) && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </button>
          <Input value={opt.text} onChange={(v) => onChange({ ...q, options: q.options.map((o) => o.id === opt.id ? { ...o, text: v } : o) })} placeholder="Option text" className="flex-1" />
          <button onClick={() => onChange({ ...q, options: q.options.filter((o) => o.id !== opt.id), correctIds: q.correctIds.filter((x) => x !== opt.id) })} className="text-[#444] hover:text-red-400 text-xs px-1">×</button>
        </div>
      ))}
      <button onClick={addOption} className="text-indigo-400 hover:text-indigo-300 text-xs">+ Add option</button>
    </div>
  )
}

function TrueFalseEditor({ q, onChange }: { q: Question & { type: 'true_false' }; onChange: (q: Question) => void }) {
  return (
    <div className="space-y-2">
      <Label>Correct answer</Label>
      <div className="flex gap-3">
        {([true, false] as const).map((val) => (
          <button key={String(val)} onClick={() => onChange({ ...q, correctAnswer: val })}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors border ${q.correctAnswer === val ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-[#2A2A2E] text-[#666] hover:border-[#3A3A3E]'}`}>
            {val ? 'True' : 'False'}
          </button>
        ))}
      </div>
    </div>
  )
}

function FillBlankEditor({ q, onChange }: { q: Question & { type: 'fill_blank' }; onChange: (q: Question) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Accepted answers</Label>
        {q.acceptedAnswers.map((ans, i) => (
          <div key={i} className="flex items-center gap-2 mb-1.5">
            <Input value={ans} onChange={(v) => { const a = [...q.acceptedAnswers]; a[i] = v; onChange({ ...q, acceptedAnswers: a }) }} placeholder="Accepted answer" className="flex-1" />
            {i > 0 && <button onClick={() => onChange({ ...q, acceptedAnswers: q.acceptedAnswers.filter((_, j) => j !== i) })} className="text-[#444] hover:text-red-400 text-xs px-1">×</button>}
          </div>
        ))}
        <button onClick={() => onChange({ ...q, acceptedAnswers: [...q.acceptedAnswers, ''] })} className="text-indigo-400 hover:text-indigo-300 text-xs">+ Add variation</button>
      </div>
      <Toggle label="Case sensitive" checked={q.caseSensitive} onChange={(v) => onChange({ ...q, caseSensitive: v })} />
    </div>
  )
}

function MatchingEditor({ q, onChange }: { q: Question & { type: 'matching' }; onChange: (q: Question) => void }) {
  return (
    <div className="space-y-2">
      <Label>Pairs</Label>
      {q.pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-2">
          <Input value={pair.left} onChange={(v) => onChange({ ...q, pairs: q.pairs.map((p) => p.id === pair.id ? { ...p, left: v } : p) })} placeholder="Left item" className="flex-1" />
          <span className="text-[#444]">→</span>
          <Input value={pair.right} onChange={(v) => onChange({ ...q, pairs: q.pairs.map((p) => p.id === pair.id ? { ...p, right: v } : p) })} placeholder="Right item" className="flex-1" />
          <button onClick={() => onChange({ ...q, pairs: q.pairs.filter((p) => p.id !== pair.id) })} className="text-[#444] hover:text-red-400 text-xs px-1">×</button>
        </div>
      ))}
      <button onClick={() => onChange({ ...q, pairs: [...q.pairs, { id: crypto.randomUUID(), left: '', right: '' }] })} className="text-indigo-400 hover:text-indigo-300 text-xs">+ Add pair</button>
    </div>
  )
}

function OrderingEditor({ q, onChange }: { q: Question & { type: 'ordering' }; onChange: (q: Question) => void }) {
  return (
    <div className="space-y-2">
      <Label>Items (correct order, top to bottom)</Label>
      {q.items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <span className="text-[#444] text-xs w-4">{i + 1}.</span>
          <Input value={item.text} onChange={(v) => onChange({ ...q, items: q.items.map((it) => it.id === item.id ? { ...it, text: v } : it) })} placeholder="Item text" className="flex-1" />
          <button onClick={() => onChange({ ...q, items: q.items.filter((it) => it.id !== item.id) })} className="text-[#444] hover:text-red-400 text-xs px-1">×</button>
        </div>
      ))}
      <button onClick={() => onChange({ ...q, items: [...q.items, { id: crypto.randomUUID(), text: '' }] })} className="text-indigo-400 hover:text-indigo-300 text-xs">+ Add item</button>
    </div>
  )
}

function NumericEditor({ q, onChange }: { q: Question & { type: 'numeric' }; onChange: (q: Question) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>Min value</Label>
        <input type="number" value={q.min} onChange={(e) => onChange({ ...q, min: parseFloat(e.target.value) || 0 })}
          className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors" />
      </div>
      <div>
        <Label>Max value</Label>
        <input type="number" value={q.max} onChange={(e) => onChange({ ...q, max: parseFloat(e.target.value) || 100 })}
          className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors" />
      </div>
    </div>
  )
}

function RatingScaleEditor({ q, onChange }: { q: Question & { type: 'rating_scale' }; onChange: (q: Question) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <Label>Scale</Label>
        <div className="flex gap-2">
          {(['1-5', '1-7'] as const).map((s) => (
            <button key={s} onClick={() => onChange({ ...q, scale: s })}
              className={`flex-1 py-1.5 rounded-lg text-xs transition-colors border ${q.scale === s ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'border-[#2A2A2E] text-[#666]'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>
      <Input value={q.labels?.low || ''} onChange={(v) => onChange({ ...q, labels: { ...q.labels, low: v, high: q.labels?.high || '' } })} placeholder="Low label (e.g. Strongly disagree)" className="w-full" />
      <Input value={q.labels?.high || ''} onChange={(v) => onChange({ ...q, labels: { ...q.labels, high: v, low: q.labels?.low || '' } })} placeholder="High label (e.g. Strongly agree)" className="w-full" />
    </div>
  )
}

// ── Question card ─────────────────────────────────────────────────────────────

function QuestionCard({ q, index, onChange, onDelete }: { q: Question; index: number; onChange: (q: Question) => void; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(index === 0)

  function renderEditor() {
    switch (q.type) {
      case 'multiple_choice':  return <MultipleChoiceEditor q={q} onChange={onChange} />
      case 'multiple_select':  return <MultipleSelectEditor q={q} onChange={onChange} />
      case 'true_false':       return <TrueFalseEditor q={q} onChange={onChange} />
      case 'fill_blank':       return <FillBlankEditor q={q} onChange={onChange} />
      case 'matching':         return <MatchingEditor q={q} onChange={onChange} />
      case 'ordering':         return <OrderingEditor q={q} onChange={onChange} />
      case 'numeric':          return <NumericEditor q={q} onChange={onChange} />
      case 'rating_scale':     return <RatingScaleEditor q={q} onChange={onChange} />
      case 'short_answer':
        return <div><Label>Sample answer (optional)</Label><Input value={(q as Question & { type: 'short_answer' }).sampleAnswer || ''} onChange={(v) => onChange({ ...q, sampleAnswer: v } as Question)} placeholder="Example answer…" className="w-full" /></div>
    }
  }

  return (
    <div className="bg-[#0F0F10] border border-[#2A2A2E] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => setExpanded(!expanded)}>
        <span className="text-[#555] text-xs font-mono w-5 flex-shrink-0">Q{index + 1}</span>
        <span className="text-[#888] text-xs flex-shrink-0">{QUESTION_TYPE_LABELS[q.type]}</span>
        <span className="text-[#ccc] text-xs truncate flex-1">{q.prompt || 'No prompt yet'}</span>
        <button onClick={(e) => { e.stopPropagation(); onDelete() }} className="text-[#444] hover:text-red-400 transition-colors p-1 flex-shrink-0">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-[#555] transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}>
          <path d="M3 4l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-[#1E1E22]">
          <div className="pt-3">
            <Label>Question prompt</Label>
            <textarea value={q.prompt} onChange={(e) => onChange({ ...q, prompt: e.target.value })} placeholder="Enter your question…" rows={2}
              className="w-full bg-[#141416] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
          </div>

          {renderEditor()}

          {/* Feedback */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1E1E22]">
            <div>
              <Label>Correct feedback</Label>
              <Input value={q.feedback?.correct || ''} onChange={(v) => onChange({ ...q, feedback: { ...q.feedback, correct: v } })} placeholder="Correct!" className="w-full" />
            </div>
            <div>
              <Label>Incorrect feedback</Label>
              <Input value={q.feedback?.incorrect || ''} onChange={(v) => onChange({ ...q, feedback: { ...q.feedback, incorrect: v } })} placeholder="Incorrect." className="w-full" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main quiz builder ─────────────────────────────────────────────────────────

const DEFAULT_CONTENT: QuizContent = {
  questions: [],
  passingScore: 80,
  attemptsAllowed: null,
  showFeedback: true,
  randomiseQuestions: false,
  randomiseOptions: false,
  onPass: { action: 'continue' },
  onFail: { action: 'retry' },
}

export default function QuizBuilder({ content, onChange, isKnowledgeCheck = false }: Props) {
  const quiz: QuizContent = { ...DEFAULT_CONTENT, ...content }

  function setField<K extends keyof QuizContent>(key: K, value: QuizContent[K]) {
    onChange({ ...quiz, [key]: value })
  }

  function addQuestion(type: QuestionType) {
    onChange({ ...quiz, questions: [...quiz.questions, makeQuestion(type)] })
  }

  function updateQuestion(index: number, q: Question) {
    const questions = [...quiz.questions]
    questions[index] = q
    onChange({ ...quiz, questions })
  }

  function deleteQuestion(index: number) {
    onChange({ ...quiz, questions: quiz.questions.filter((_, i) => i !== index) })
  }

  const questionTypes = Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]

  return (
    <div className="space-y-4">
      {/* Questions */}
      {quiz.questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          q={q}
          index={i}
          onChange={(updated) => updateQuestion(i, updated)}
          onDelete={() => deleteQuestion(i)}
        />
      ))}

      {/* Add question */}
      <div className="border border-dashed border-[#2A2A2E] rounded-xl p-4">
        <p className="text-[#555] text-xs mb-3">Add question</p>
        <div className="flex flex-wrap gap-1.5">
          {questionTypes.map(([type, label]) => (
            <button key={type} onClick={() => addQuestion(type)}
              className="text-[#888] hover:text-white hover:bg-indigo-500/20 hover:border-indigo-500/50 border border-[#2A2A2E] text-xs px-2.5 py-1.5 rounded-lg transition-colors">
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quiz settings */}
      {!isKnowledgeCheck && (
        <div className="border border-[#1E1E22] rounded-xl p-4 space-y-4">
          <p className="text-[#666] text-xs font-medium uppercase tracking-wider">Quiz settings</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Passing score (%)</Label>
              <input type="number" min={0} max={100} value={quiz.passingScore}
                onChange={(e) => setField('passingScore', parseInt(e.target.value) || 0)}
                className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
            <div>
              <Label>Attempts allowed</Label>
              <input type="number" min={1} value={quiz.attemptsAllowed ?? ''} placeholder="Unlimited"
                onChange={(e) => setField('attemptsAllowed', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs placeholder:text-[#444] focus:outline-none focus:border-indigo-500 transition-colors" />
            </div>
          </div>

          <Toggle label="Show feedback after each question" checked={quiz.showFeedback} onChange={(v) => setField('showFeedback', v)} />
          <Toggle label="Randomise question order" checked={quiz.randomiseQuestions} onChange={(v) => setField('randomiseQuestions', v)} />
          <Toggle label="Randomise option order" checked={quiz.randomiseOptions} onChange={(v) => setField('randomiseOptions', v)} />

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1E1E22]">
            <div>
              <Label>On pass</Label>
              <select value={quiz.onPass.action} onChange={(e) => setField('onPass', { action: e.target.value as 'continue' | 'jump' })}
                className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors">
                <option value="continue">Continue</option>
                <option value="jump">Jump to lesson</option>
              </select>
            </div>
            <div>
              <Label>On fail</Label>
              <select value={quiz.onFail.action} onChange={(e) => setField('onFail', { action: e.target.value as 'retry' | 'jump' | 'end' })}
                className="w-full bg-[#0F0F10] border border-[#2A2A2E] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors">
                <option value="retry">Retry quiz</option>
                <option value="jump">Jump to lesson</option>
                <option value="end">End course</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {quiz.questions.length === 0 && (
        <p className="text-[#444] text-xs text-center py-2">
          No questions yet — add one above
        </p>
      )}
    </div>
  )
}