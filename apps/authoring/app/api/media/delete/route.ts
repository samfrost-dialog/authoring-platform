import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/server'
import { deleteObject } from '@/lib/r2/client'

export async function DELETE(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await request.json()
  if (!key) return NextResponse.json({ error: 'Missing key' }, { status: 400 })

  // Verify the key belongs to the user's org
  const { data: orgUser } = await supabase
    .from('org_users')
    .select('org_id')
    .eq('user_id', session.user.id)
    .single()

  if (!orgUser || !key.startsWith(`media/${orgUser.org_id}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await deleteObject(key)
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('R2 delete error:', err)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
