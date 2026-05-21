import { redirect } from 'next/navigation'
import { createServerClient } from '@/lib/db/server'
import DashboardNav from '@/components/dashboard/nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0F0F10] flex">
      <DashboardNav user={session.user} />
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  )
}
