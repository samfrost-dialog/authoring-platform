import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/server'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users').select('org_id').eq('user_id', session.user.id).single()
  if (!orgUser) return NextResponse.json([])

  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, title, status, updated_at')
    .eq('org_id', orgUser.org_id)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(courses ?? [])
}

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users').select('org_id').eq('user_id', session.user.id).single()
  if (!orgUser) return NextResponse.json({ error: 'No organisation' }, { status: 403 })

  const body = await request.json()
  const { data: course, error } = await supabase
    .from('courses')
    .insert({
      title:      body.title || 'Untitled Course',
      description: body.description || null,
      org_id:     orgUser.org_id,
      created_by: session.user.id,
      status:     'draft',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(course)
}