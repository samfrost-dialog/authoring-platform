import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/server'
import { getPresignedPutUrl, mediaKey } from '@/lib/r2/client'

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm', 'audio/mp4'],
  font:  ['font/woff', 'font/woff2', 'font/ttf', 'application/font-woff'],
  file:  ['application/pdf', 'application/zip', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}

const MAX_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,  // 10 MB
  video: 500 * 1024 * 1024, // 500 MB
  audio: 50 * 1024 * 1024,  // 50 MB
  font:  5 * 1024 * 1024,   // 5 MB
  file:  100 * 1024 * 1024, // 100 MB
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orgUser } = await supabase
    .from('org_users')
    .select('org_id')
    .eq('user_id', session.user.id)
    .single()

  if (!orgUser) return NextResponse.json({ error: 'No organisation' }, { status: 403 })

  const body = await request.json()
  const { filename, contentType, fileSize, courseId, category = 'image' } = body

  if (!filename || !contentType || !courseId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Validate content type
  const allowed = ALLOWED_TYPES[category] ?? ALLOWED_TYPES.image
  if (!allowed.includes(contentType)) {
    return NextResponse.json({ error: `File type ${contentType} not allowed for ${category}` }, { status: 400 })
  }

  // Validate file size
  const maxSize = MAX_SIZES[category] ?? MAX_SIZES.file
  if (fileSize && fileSize > maxSize) {
    return NextResponse.json({ error: `File too large (max ${maxSize / 1024 / 1024}MB)` }, { status: 400 })
  }

  // Generate unique key
  const ext = filename.split('.').pop() ?? 'bin'
  const uuid = crypto.randomUUID()
  const key = mediaKey(orgUser.org_id, courseId, `${uuid}.${ext}`)

  try {
    const uploadUrl = await getPresignedPutUrl(key, contentType)
    return NextResponse.json({ uploadUrl, key })
  } catch (err) {
    console.error('R2 presign error:', err)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
