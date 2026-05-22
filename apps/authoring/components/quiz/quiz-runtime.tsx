'use client'

import { useState, useEffect, useCallback } from 'react'
import type { Question, QuizContent, QuizAttempt } from './quiz-types'
import { scoreQuiz, isCorrect } from './quiz-types'
import { useScormTracking } from './use-scorm-tracking'

interface Props {
  content: QuizContent
  isKnowledgeCheck?: boolean
  courseId?: string
  onComplete?: (attempt: QuizAttempt) => void
}

type Phase = 'intro' | 'question' | 'feedback' | 'results'

// ── Answer inputs ─────────────────────────────────────────────────────────────

function MultipleChoiceInput({ q, value, onChange }: { q: Question & { type: 'multiple_choice' }; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {q.options.map((opt) => (
        <button key={opt.id} onClick={() => onChange(opt.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
            value === opt.id ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}>
          <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-colors ${value === opt.id ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`} />
          {opt.text}
        </button>
      ))}
    </div>
  )
}

function MultipleSelectInput({ q, value, onChange }: { q: Question & { type: 'multiple_select' }; value: string[]; onChange: (v: string[]) => void }) {
  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])
  }
  return (
    <div className="space-y-2">
      <p className="text-gray-500 text-xs mb-3">Select all that apply</p>
      {q.options.map((opt) => (
        <button key={opt.id} onClick={() => toggle(opt.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all ${
            value.includes(opt.id) ? 'border-indigo-500 bg-indigo-500/10 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}>
          <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${value.includes(opt.id) ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
            {value.includes(opt.id) && <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          {opt.text}
        </button>
      ))}
    </div>
  )
}

function TrueFalseInput({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div className="flex gap-4">
      {([true, false] as const).map((v) => (
        <button key={String(v)} onClick={() => onChange(v)}
          className={`flex-1 py-4 rounded-xl border text-sm font-medium transition-all ${
            value === v ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600' : 'border-gray-200 hover:border-gray-300 text-gray-700'
          }`}>
          {v ? 'True' : 'False'}
        </button>
      ))}
    </div>
  )
}

function FillBlankInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type your answer…"
      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
  )
}

function MatchingInput({ q, value, onChange }: { q: Question & { type: 'matching' }; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const shuffledRight = [...q.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5)
  return (
    <div className="space-y-3">
      {q.pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-3">
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">{pair.left}</div>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400 flex-shrink-0">
            <path d="M4 8h8M9 5l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <select value={value[pair.id] || ''} onChange={(e) => onChange({ ...value, [pair.id]: e.target.value })}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-indigo-500 bg-white">
            <option value="">Select…</option>
            {shuffledRight.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      ))}
    </div>
  )
}

function NumericInput({ q, value, onChange }: { q: Question & { type: 'numeric' }; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Enter a number"
        min={q.min} max={q.max}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors" />
      <p className="text-gray-400 text-xs mt-1">Valid range: {q.min} – {q.max}</p>
    </div>
  )
}

function RatingScaleInput({ q, value, onChange }: { q: Question & { type: 'rating_scale' }; value: number | null; onChange: (v: number) => void }) {
  const max = q.scale === '1-7' ? 7 : 5
  return (
    <div>
      <div className="flex items-center gap-2 justify-between">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button key={n} onClick={() => onChange(n)}
            className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
              value === n ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-200 hover:border-gray-300 text-gray-700'
            }`}>
            {n}
          </button>
        ))}
      </div>
      {q.labels && (
        <div className="flex justify-between mt-2">
          <span className="text-gray-400 text-xs">{q.labels.low}</span>
          <span className="text-gray-400 text-xs">{q.labels.high}</span>
        </div>
      )}
    </div>
  )
}

// ── Answer input dispatcher ───────────────────────────────────────────────────

function AnswerInput({ q, value, onChange }: { q: Question; value: unknown; onChange: (v: unknown) => void }) {
  switch (q.type) {
    case 'multiple_choice':
      return <MultipleChoiceInput q={q} value={(value as string) || ''} onChange={onChange} />
    case 'multiple_select':
      return <MultipleSelectInput q={q} value={(value as string[]) || []} onChange={onChange} />
    case 'true_false':
      return <TrueFalseInput value={value as boolean | null} onChange={onChange} />
    case 'fill_blank':
      return <FillBlankInput value={(value as string) || ''} onChange={onChange} />
    case 'matching':
      return <MatchingInput q={q} value={(value as Record<string, string>) || {}} onChange={onChange} />
    case 'numeric':
      return <NumericInput q={q} value={(value as string) || ''} onChange={onChange} />
    case 'short_answer':
      return <textarea value={(value as string) || ''} onChange={(e) => onChange(e.target.value)} placeholder="Type your answer…" rows={4}
        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none" />
    case 'rating_scale':
      return <RatingScaleInput q={q} value={value as number | null} onChange={onChange} />
    case 'ordering':
      return <OrderingInput q={q} value={(value as string[]) || q.items.map((i) => i.id)} onChange={onChange} />
    default:
      return null
  }
}

function OrderingInput({ q, value, onChange }: { q: Question & { type: 'ordering' }; value: string[]; onChange: (v: string[]) => void }) {
  const ordered = value.length === q.items.length ? value : q.items.map((i) => i.id)
  function move(index: number, dir: -1 | 1) {
    const arr = [...ordered]
    const swap = index + dir
    if (swap < 0 || swap >= arr.length) return
    ;[arr[index], arr[swap]] = [arr[swap], arr[index]]
    onChange(arr)
  }
  return (
    <div className="space-y-2">
      <p className="text-gray-500 text-xs mb-3">Drag or use arrows to reorder</p>
      {ordered.map((id, i) => {
        const item = q.items.find((it) => it.id === id)
        if (!item) return null
        return (
          <div key={id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <span className="text-gray-400 text-xs font-mono w-5">{i + 1}.</span>
            <span className="flex-1 text-sm text-gray-700">{item.text}</span>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(i, -1)} disabled={i === 0} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M9 8L6 5l-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button onClick={() => move(i, 1)} disabled={i === ordered.length - 1} className="text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main quiz runtime ─────────────────────────────────────────────────────────

export default function QuizRuntime({ content, isKnowledgeCheck = false, courseId = '', onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [attempt, setAttempt] = useState(1)
  const [startTime] = useState(Date.now())
  const [lastFeedback, setLastFeedback] = useState<{ correct: boolean; message: string } | null>(null)

  const questions = content.randomiseQuestions
    ? [...content.questions].sort(() => Math.random() - 0.5)
    : content.questions

  const currentQuestion = questions[currentIndex]
  const totalQuestions = questions.length
  const isLast = currentIndex === totalQuestions - 1

  const handleSubmitAnswer = useCallback(() => {
    const answer = answers[currentQuestion.id]
    if (content.showFeedback && currentQuestion.type !== 'short_answer' && currentQuestion.type !== 'rating_scale') {
      const correct = isCorrect(currentQuestion, answer)
      setLastFeedback({
        correct,
        message: correct
          ? (currentQuestion.feedback?.correct || 'Correct!')
          : (currentQuestion.feedback?.incorrect || 'Incorrect.'),
      })
      setPhase('feedback')
    } else {
      advanceOrFinish()
    }
  }, [answers, currentQuestion, content.showFeedback])

  function advanceOrFinish() {
    setLastFeedback(null)
    if (isLast) {
      finishQuiz()
    } else {
      setCurrentIndex((i) => i + 1)
      setPhase('question')
    }
  }

  const { recordAttempt } = useScormTracking({
    courseId,
    questions,
    passingScore: content.passingScore,
  })

  function finishQuiz() {
    const score = scoreQuiz(questions, answers)
    const passed = score >= content.passingScore
    const result: QuizAttempt = { answers, score, passed, completed: true, startedAt: startTime }
    if (!isKnowledgeCheck) {
      recordAttempt(result)
    }
    onComplete?.(result)
    setPhase('results')
  }

  function retryQuiz() {
    setAnswers({})
    setCurrentIndex(0)
    setAttempt((a) => a + 1)
    setPhase('question')
  }

  if (phase === 'intro') {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-indigo-600 font-bold text-lg">?</span>
        </div>
        <h3 className="text-gray-900 font-semibold text-lg mb-2">
          {isKnowledgeCheck ? 'Knowledge Check' : 'Quiz'}
        </h3>
        <p className="text-gray-500 text-sm mb-1">{totalQuestions} question{totalQuestions !== 1 ? 's' : ''}</p>
        {!isKnowledgeCheck && <p className="text-gray-400 text-xs mb-6">Passing score: {content.passingScore}%</p>}
        <button onClick={() => setPhase('question')}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-8 py-3 rounded-xl transition-colors">
          Start
        </button>
      </div>
    )
  }

  if (phase === 'results') {
    const score = scoreQuiz(questions, answers)
    const passed = score >= content.passingScore
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${passed ? 'bg-green-100' : 'bg-red-100'}`}>
          {passed
            ? <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 14l6 6 12-12" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M7 7l14 14M21 7L7 21" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round"/></svg>
          }
        </div>
        <h3 className={`text-2xl font-bold mb-1 ${passed ? 'text-green-600' : 'text-red-600'}`}>{score}%</h3>
        <p className="text-gray-500 text-sm mb-6">{passed ? 'You passed!' : `You need ${content.passingScore}% to pass`}</p>

        {!passed && content.onFail.action === 'retry' && (
          content.attemptsAllowed === null || attempt < content.attemptsAllowed
        ) && (
          <button onClick={retryQuiz} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-8 py-3 rounded-xl transition-colors">
            Try again
          </button>
        )}
      </div>
    )
  }

  if (phase === 'feedback' && lastFeedback) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className={`flex items-center gap-3 mb-4 p-4 rounded-xl ${lastFeedback.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${lastFeedback.correct ? 'bg-green-500' : 'bg-red-500'}`}>
            {lastFeedback.correct
              ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
            }
          </div>
          <p className={`text-sm font-medium ${lastFeedback.correct ? 'text-green-800' : 'text-red-800'}`}>{lastFeedback.message}</p>
        </div>
        <div className="flex justify-end">
          <button onClick={advanceOrFinish} className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors">
            {isLast ? 'See results' : 'Next question'}
          </button>
        </div>
      </div>
    )
  }

  // Question phase
  const hasAnswer = answers[currentQuestion?.id] !== undefined

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Progress */}
      <div className="h-1 bg-gray-100">
        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentIndex) / totalQuestions) * 100}%` }} />
      </div>

      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <span className="text-gray-400 text-xs">{isKnowledgeCheck ? 'Knowledge Check' : 'Quiz'}</span>
          <span className="text-gray-400 text-xs">{currentIndex + 1} / {totalQuestions}</span>
        </div>

        <h3 className="text-gray-900 font-medium text-base mb-6">{currentQuestion?.prompt || 'Question'}</h3>

        {currentQuestion && (
          <AnswerInput
            q={currentQuestion}
            value={answers[currentQuestion.id]}
            onChange={(v) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: v }))}
          />
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={handleSubmitAnswer}
            disabled={!hasAnswer}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors"
          >
            {isLast ? 'Submit' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}