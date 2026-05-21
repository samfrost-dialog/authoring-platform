'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/db/client'
import type { User } from '@supabase/supabase-js'

const NAV_ITEMS = [
  {
    label: 'Courses',
    href: '/dashboard',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    label: 'Themes',
    href: '/dashboard/themes',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
        <circle cx="8" cy="5" r="1.5" fill="currentColor"/>
        <circle cx="11" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="5" cy="10" r="1.5" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: 'Import SCORM',
    href: '/dashboard/import',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 2v8M5 7l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 11v1.5A1.5 1.5 0 003.5 14h9a1.5 1.5 0 001.5-1.5V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function DashboardNav({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="w-56 min-h-screen bg-[#111113] border-r border-[#1E1E22] flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#1E1E22]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1" fill="white"/>
              <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
              <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <span className="text-white text-sm font-semibold tracking-tight">Authoring</span>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : 'text-[#666] hover:text-[#ccc] hover:bg-white/5'
              }`}
            >
              <span className={active ? 'text-indigo-400' : 'text-[#555]'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          )
        })}
      </div>

      {/* User / sign out */}
      <div className="px-3 py-4 border-t border-[#1E1E22]">
        <div className="px-3 py-2 mb-1">
          <p className="text-[#ccc] text-xs font-medium truncate">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[#666] hover:text-[#ccc] hover:bg-white/5 transition-colors w-full text-left"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sign out
        </button>
      </div>
    </nav>
  )
}
