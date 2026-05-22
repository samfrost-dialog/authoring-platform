import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/server'
import { validateScormPackage } from '@/lib/scorm/validator'

export const maxDuration = 30

export async function POST(request: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await validateScormPackage(buffer)

    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Validation failed' },
      { status: 500 }
    )
  }
}