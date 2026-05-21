import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import type { CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@authoring/block-schema/database.types'

export async function createServerClient() {
  const cookieStore = await cookies()

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return cookieStore.getAll()
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        )
      } catch {
        // Server Component — cookie mutation handled by proxy
      }
    },
  }

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieMethods }
  )
}

export async function createAdminClient() {
  const cookieMethods: CookieMethodsServer = {
    getAll() { return [] },
    setAll() {},
  }

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: cookieMethods,
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )
}