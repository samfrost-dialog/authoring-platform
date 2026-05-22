export type QuestionType =
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'numeric'
  | 'short_answer'
  | 'rating_scale'

export interface BaseQuestion {
  id: string
  type: QuestionType
  prompt: string
  feedback?: { correct?: string; incorrect?: string }
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice'
  options: { id: string; text: string }[]
  correctId: string
}

export interface MultipleSelectQuestion extends BaseQuestion {
  type: 'multiple_select'
  options: { id: string; text: string }[]
  correctIds: string[]
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false'
  correctAnswer: boolean
}

export interface FillBlankQuestion extends BaseQuestion {
  type: 'fill_blank'
  acceptedAnswers: string[]
  caseSensitive: boolean
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching'
  pairs: { id: string; left: string; right: string }[]
}

export interface OrderingQuestion extends BaseQuestion {
  type: 'ordering'
  items: { id: string; text: string }[]
}

export interface NumericQuestion extends BaseQuestion {
  type: 'numeric'
  min: number
  max: number
}

export interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer'
  sampleAnswer?: string
}

export interface RatingScaleQuestion extends BaseQuestion {
  type: 'rating_scale'
  scale: '1-5' | '1-7'
  labels?: { low: string; high: string }
}

export type Question =
  | MultipleChoiceQuestion
  | MultipleSelectQuestion
  | TrueFalseQuestion
  | FillBlankQuestion
  | MatchingQuestion
  | OrderingQuestion
  | NumericQuestion
  | ShortAnswerQuestion
  | RatingScaleQuestion

export interface QuizContent {
  questions: Question[]
  passingScore: number
  attemptsAllowed: number | null
  showFeedback: boolean
  randomiseQuestions: boolean
  randomiseOptions: boolean
  onPass: { action: 'continue' | 'jump'; lessonId?: string }
  onFail: { action: 'retry' | 'jump' | 'end'; lessonId?: string }
}

export interface QuizAttempt {
  answers: Record<string, unknown> // questionId -> answer
  score: number
  passed: boolean
  completed: boolean
  startedAt: number
}

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice:  'Multiple choice',
  multiple_select:  'Multiple select',
  true_false:       'True / False',
  fill_blank:       'Fill in the blank',
  matching:         'Matching',
  ordering:         'Ordering',
  numeric:          'Numeric',
  short_answer:     'Short answer',
  rating_scale:     'Rating scale',
}

export const SCORM_INTERACTION_TYPES: Record<QuestionType, string> = {
  multiple_choice:  'choice',
  multiple_select:  'choice',
  true_false:       'true-false',
  fill_blank:       'fill-in',
  matching:         'matching',
  ordering:         'sequencing',
  numeric:          'numeric',
  short_answer:     'fill-in',
  rating_scale:     'likert',
}

export function makeQuestion(type: QuestionType): Question {
  const base = { id: crypto.randomUUID(), type, prompt: '', feedback: { correct: 'Correct!', incorrect: 'Incorrect.' } }
  switch (type) {
    case 'multiple_choice':
      return { ...base, type, options: [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }], correctId: '' }
    case 'multiple_select':
      return { ...base, type, options: [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }], correctIds: [] }
    case 'true_false':
      return { ...base, type, correctAnswer: true }
    case 'fill_blank':
      return { ...base, type, acceptedAnswers: [''], caseSensitive: false }
    case 'matching':
      return { ...base, type, pairs: [{ id: crypto.randomUUID(), left: '', right: '' }] }
    case 'ordering':
      return { ...base, type, items: [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }] }
    case 'numeric':
      return { ...base, type, min: 0, max: 100 }
    case 'short_answer':
      return { ...base, type, sampleAnswer: '' }
    case 'rating_scale':
      return { ...base, type, scale: '1-5', labels: { low: 'Strongly disagree', high: 'Strongly agree' } }
  }
}

export function scoreQuiz(questions: Question[], answers: Record<string, unknown>): number {
  if (!questions.length) return 0
  let correct = 0
  for (const q of questions) {
    const answer = answers[q.id]
    if (isCorrect(q, answer)) correct++
  }
  return Math.round((correct / questions.length) * 100)
}

export function isCorrect(question: Question, answer: unknown): boolean {
  switch (question.type) {
    case 'multiple_choice':
      return answer === question.correctId
    case 'multiple_select': {
      const selected = (answer as string[]) || []
      const correct = question.correctIds
      return selected.length === correct.length && correct.every((id) => selected.includes(id))
    }
    case 'true_false':
      return answer === question.correctAnswer
    case 'fill_blank': {
      const ans = ((answer as string) || '').trim()
      return question.acceptedAnswers.some((a) =>
        question.caseSensitive ? a === ans : a.toLowerCase() === ans.toLowerCase()
      )
    }
    case 'matching': {
      const ans = (answer as Record<string, string>) || {}
      return question.pairs.every((p) => ans[p.id] === p.right)
    }
    case 'ordering': {
      const ans = (answer as string[]) || []
      return question.items.every((item, i) => item.id === ans[i])
    }
    case 'numeric': {
      const n = parseFloat(answer as string)
      return !isNaN(n) && n >= question.min && n <= question.max
    }
    case 'short_answer':
    case 'rating_scale':
      return true // unscored / manual
    default:
      return false
  }
}