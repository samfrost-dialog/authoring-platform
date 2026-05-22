import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/server'
import { getPresignedPutUrl, fontKey } from '@/lib/r2/client'

const ALLOWED_FONT_TYPES = [
  'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
  'application/font-woff', 'application/font-woff2',
  'application/x-font-ttf', 'application/x-font-otf',
  'application/octet-stream', // some browsers send this for font files
]

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users').select('org_id').eq('user_id', session.user.id).single()
  if (!orgUser) return NextResponse.json({ error: 'No organisation' }, { status: 403 })

  const { filename, contentType, fileSize } = await request.json()
  if (!filename || !contentType) {
    return NextResponse.json({ error: 'Missing filename or contentType' }, { status: 400 })
  }

  if (fileSize && fileSize > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Font file too large (max 5MB)' }, { status: 400 })
  }

  const ext = filename.split('.').pop()?.toLowerCase() ?? 'woff2'
  const uuid = crypto.randomUUID()
  const key = fontKey(orgUser.org_id, `${uuid}.${ext}`)
  const fontName = filename.replace(/\.[^.]+$/, '') // strip extension for display

  try {
    const uploadUrl = await getPresignedPutUrl(key, contentType)
    return NextResponse.json({ uploadUrl, key, fontName })
  } catch (err) {
    console.error('R2 font presign error:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}