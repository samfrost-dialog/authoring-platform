import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/server'

export default async function HomePage() {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  redirect('/dashboard')
}