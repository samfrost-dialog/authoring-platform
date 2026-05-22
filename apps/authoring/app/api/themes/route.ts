import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/server'

export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users').select('org_id').eq('user_id', session.user.id).single()
  if (!orgUser) return NextResponse.json({ error: 'No organisation' }, { status: 403 })

  const { data: themes, error } = await supabase
    .from('themes').select('*').eq('org_id', orgUser.org_id).order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(themes)
}

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users').select('org_id, role').eq('user_id', session.user.id).single()
  if (!orgUser || orgUser.role !== 'org_admin') {
    return NextResponse.json({ error: 'Only org admins can create themes' }, { status: 403 })
  }

  const body = await request.json()
  const { data: theme, error } = await supabase
    .from('themes')
    .insert({ ...body, org_id: orgUser.org_id })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(theme)
}