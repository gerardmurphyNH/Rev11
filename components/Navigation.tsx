'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  {
    href: '/',
    label: 'Matches',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        <path d="M2 12h20" />
      </svg>
    ),
  },
  {
    href: '/leaderboard',
    label: 'Leaderboard',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'My Picks',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
]

export default function Navigation() {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => setIsAdmin(data.isAdmin === true))
      .catch(() => {})
  }, [])

  // Don't show nav on auth pages or admin
  if (pathname.startsWith('/auth') || pathname.startsWith('/admin')) return null

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex fixed left-0 top-0 h-full w-64 bg-[#061629] border-r border-white/10 flex-col z-40">
        <div className="p-6 border-b border-white/10">
          <Link href="/">
            <h1
              className="text-3xl font-bold text-[#F5F0E8] tracking-widest uppercase"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              REV11
            </h1>
            <p className="text-[#C5A55A] text-xs tracking-widest mt-1 uppercase">Predict the Starting XI</p>
          </Link>
        </div>
        <div className="flex-1 py-6">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-6 py-4 text-sm font-semibold uppercase tracking-wider transition-all ${
                  active
                    ? 'text-[#F5F0E8] bg-[#CE0E2D]/20 border-r-2 border-[#CE0E2D]'
                    : 'text-white/60 hover:text-[#F5F0E8] hover:bg-white/5'
                }`}
                style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.1em' }}
              >
                {item.icon(active)}
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="p-6 border-t border-white/10">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center justify-center gap-2 w-full mb-3 px-3 py-2 bg-[#CE0E2D]/10 border border-[#CE0E2D]/30 rounded text-[#CE0E2D] text-xs font-semibold uppercase tracking-wider hover:bg-[#CE0E2D]/20 transition-colors"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              Admin
            </Link>
          )}
          <p
            className="text-white/30 text-xs text-center uppercase tracking-wider"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            ★ The Fort ★
          </p>
        </div>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#061629] border-t border-white/10 z-40 bottom-nav-safe">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] transition-all ${
                  active ? 'text-[#CE0E2D]' : 'text-white/50 hover:text-white/80'
                }`}
              >
                {item.icon(active)}
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="flex flex-col items-center gap-1 px-4 py-2 min-w-[64px] text-[#CE0E2D]/70 hover:text-[#CE0E2D] transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              <span
                className="text-[10px] uppercase tracking-wider"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Admin
              </span>
            </Link>
          )}
        </div>
      </nav>
    </>
  )
}
