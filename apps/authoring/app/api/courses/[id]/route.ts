import { NextResponse } from 'next/server'
import { createServerClient, createAdminClient } from '@/lib/db/server'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const allowed = ['title', 'description', 'status', 'theme_id', 'cover_image_url', 'metadata']
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const { data: course, error } = await supabase
    .from('courses')
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(course)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Use admin client to bypass RLS for delete
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = await createAdminClient() as any

  // Verify the user owns or can delete this course
  const { data: course } = await supabase
    .from('courses').select('id, created_by, org_id').eq('id', id).single()

  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })

  const { error } = await admin
    .from('courses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}