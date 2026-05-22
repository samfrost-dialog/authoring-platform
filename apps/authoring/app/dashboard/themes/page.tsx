import { createServerClient } from '@/lib/db/server'
import ThemesList from '@/components/themes/themes-list'

export default async function ThemesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createServerClient() as any

  const { data: { session } } = await supabase.auth.getSession()
  const { data: orgUser } = await supabase
    .from('org_users').select('org_id').eq('user_id', session?.user?.id).single()

  const { data: themes } = orgUser
    ? await supabase.from('themes').select('*').eq('org_id', orgUser.org_id).order('name')
    : { data: [] }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Themes</h1>
          <p className="text-[#666] text-sm mt-0.5">{themes?.length ?? 0} theme{themes?.length !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <ThemesList initialThemes={themes ?? []} />
    </div>
  )
}