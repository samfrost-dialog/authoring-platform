import { useCallback } from 'react'
import type { QuizAttempt, Question } from './quiz-types'
import { SCORM_INTERACTION_TYPES } from './quiz-types'

interface ScormTrackingOptions {
  courseId: string
  learnerId?: string
  passingScore: number
  questions: Question[]
}

export function useScormTracking({
  courseId,
  learnerId,
  passingScore,
  questions,
}: ScormTrackingOptions) {

  const recordAttempt = useCallback(async (attempt: QuizAttempt) => {
    const lessonStatus = attempt.passed ? 'passed' : 'failed'

    // Build SCORM interactions array
    const interactions = questions.map((q, index) => ({
      index,
      id: q.id,
      type: SCORM_INTERACTION_TYPES[q.type],
      response: JSON.stringify(attempt.answers[q.id] ?? ''),
      result: attempt.passed ? 'correct' : 'wrong',
      latency: 0,
    }))

    // In SCORM export context: use window.ScormAPI directly
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any
    if (typeof window !== 'undefined' && win.ScormAPI) {
      const scorm = win.ScormAPI
      scorm.setScore(attempt.score, 0, 100)
      scorm.setLessonStatus(lessonStatus)
      scorm.setSuspendData({ answers: attempt.answers, score: attempt.score })
      interactions.forEach((i) => {
        scorm.recordInteraction(i.index, i.id, i.type, i.response, i.result, i.latency)
      })
      scorm.commit()
      return
    }

    // In preview context: record via API
    try {
      await fetch('/api/quiz-attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          learnerId: learnerId || 'preview-user',
          scoreRaw: attempt.score,
          scoreMax: 100,
          scoreMin: 0,
          lessonStatus,
          suspendData: { answers: attempt.answers, score: attempt.score },
          interactions,
        }),
      })
    } catch (err) {
      console.warn('[SCORM] Failed to record attempt:', err)
    }
  }, [courseId, learnerId, questions])

  return { recordAttempt }
}