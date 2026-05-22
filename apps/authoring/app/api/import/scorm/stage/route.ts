import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/server'
import { getPresignedPutUrl, importStagingKey } from '@/lib/r2/client'

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users').select('org_id, role').eq('user_id', session.user.id).single()
  if (!orgUser || !['org_admin', 'author'].includes(orgUser.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const { filename } = await request.json()
  if (!filename?.endsWith('.zip')) {
    return NextResponse.json({ error: 'File must be a .zip package' }, { status: 400 })
  }

  const sessionId = crypto.randomUUID()
  const key = importStagingKey(sessionId)

  try {
    const uploadUrl = await getPresignedPutUrl(key, 'application/zip', 3600)
    return NextResponse.json({ uploadUrl, sessionId, key })
  } catch (err) {
    console.error('Stage presign error:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}