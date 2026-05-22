import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/db/server'

/**
 * Records a quiz attempt in SCORM-compatible format.
 * Uses the admin client because this is called from the learner context
 * (preview) where the user may not be authenticated as an org member.
 * In the SCORM export, this will be replaced by direct LMS API calls.
 */
export async function POST(request: Request) {
  const body = await request.json()
  const {
    courseId,
    learnerId,
    scoreRaw,
    scoreMax = 100,
    scoreMin = 0,
    lessonStatus,
    suspendData,
    interactions = [],
  } = body

  if (!courseId || !learnerId) {
    return NextResponse.json({ error: 'courseId and learnerId required' }, { status: 400 })
  }

  // Validate lessonStatus against SCORM 1.2 spec
  const validStatuses = ['passed', 'failed', 'completed', 'incomplete', 'not attempted', 'browsed']
  if (lessonStatus && !validStatuses.includes(lessonStatus)) {
    return NextResponse.json({ error: `Invalid lessonStatus: ${lessonStatus}` }, { status: 400 })
  }

  // Enforce suspend_data 4096 char limit per SCORM 1.2 spec
  const truncatedSuspendData = suspendData
    ? JSON.stringify(suspendData).substring(0, 4096)
    : null

  try {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        course_id:     courseId,
        learner_id:    learnerId,
        score_raw:     scoreRaw ?? null,
        score_max:     scoreMax,
        score_min:     scoreMin,
        lesson_status: lessonStatus ?? 'completed',
        suspend_data:  truncatedSuspendData,
        started_at:    new Date().toISOString(),
        completed_at:  new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    // Log SCORM interactions separately (for reporting)
    // In Phase 4, these will map to cmi.interactions.n.*
    if (interactions.length > 0) {
      console.log(`[SCORM] Recorded ${interactions.length} interactions for course ${courseId}`)
    }

    return NextResponse.json({
      id: data.id,
      scorm: {
        'cmi.core.lesson_status':  lessonStatus,
        'cmi.core.score.raw':      scoreRaw,
        'cmi.core.score.min':      scoreMin,
        'cmi.core.score.max':      scoreMax,
        'cmi.suspend_data':        truncatedSuspendData,
      }
    })
  } catch (err) {
    console.error('Quiz attempt error:', err)
    return NextResponse.json({ error: 'Failed to record attempt' }, { status: 500 })
  }
}