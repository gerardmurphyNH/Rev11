import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, formatMatchDate } from '@/lib/utils'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const userEmail = cookieStore.get('rev11_user_email')?.value
  if (!userEmail || !isAdmin(userEmail)) redirect('/')

  const [
    { count: userCount },
    { count: matchCount },
    { count: playerCount },
    { data: pendingLineups },
    { data: errorMatches },
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('matches').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('players').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin
      .from('correct_lineups')
      .select('id, status, matches (id, opponent, match_date)')
      .eq('status', 'pending'),
    supabaseAdmin
      .from('matches')
      .select('id, opponent, match_date')
      .eq('status', 'upcoming')
      .lt('match_date', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()),
  ])

  const adminLinks = [
    { href: '/admin/roster', label: 'Manage Roster', icon: '👤', desc: `${playerCount} active players` },
    { href: '/admin/matches', label: 'Manage Matches', icon: '📅', desc: `${matchCount} total matches` },
  ]

  return (
    <div className="min-h-screen bg-[#0A2240] p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Admin Dashboard
            </h1>
            <p className="text-white/40 text-sm mt-1">{userEmail}</p>
          </div>
          <Link href="/" className="text-[#C5A55A] text-sm hover:underline">← Back to app</Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Users', value: userCount || 0 },
            { label: 'Matches', value: matchCount || 0 },
            { label: 'Players', value: playerCount || 0 },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#0D2D52] rounded-lg border border-white/10 p-4 text-center">
              <p className="text-3xl font-black text-[#C5A55A]" style={{ fontFamily: 'Courier New, monospace' }}>{value}</p>
              <p className="text-xs uppercase tracking-widest text-white/40 mt-1" style={{ fontFamily: "'Oswald', sans-serif" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Pending lineups */}
        {pendingLineups && pendingLineups.length > 0 && (
          <div className="mb-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-yellow-400 mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
              ⚠️ Pending Lineup Confirmations
            </h2>
            {(pendingLineups as any[]).map((l: any) => {
              const match = l.matches as any
              return (
                <Link key={l.id} href={`/admin/lineup/${match?.id}`} className="flex items-center justify-between py-2 hover:opacity-80">
                  <span className="text-[#F5F0E8] text-sm">{match?.opponent}</span>
                  <span className="text-[#C5A55A] text-xs">Confirm →</span>
                </Link>
              )
            })}
          </div>
        )}

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {adminLinks.map(({ href, label, icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="bg-[#0D2D52] border border-white/10 rounded-lg p-5 hover:border-white/20 hover:bg-[#0D2D52]/80 transition-all group"
            >
              <div className="text-3xl mb-2">{icon}</div>
              <h3 className="font-bold uppercase tracking-wider text-[#F5F0E8] group-hover:text-[#C5A55A] transition-colors" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {label}
              </h3>
              <p className="text-white/40 text-sm mt-1">{desc}</p>
            </Link>
          ))}
        </div>

        {/* Scrape buttons */}
        <div className="bg-[#0D2D52] border border-white/10 rounded-lg p-5">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#C5A55A] mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Manual Sync
          </h2>
          <div className="flex gap-3 flex-wrap">
            <form action="/api/cron/scrape-roster" method="POST">
              <button className="bg-white/10 hover:bg-white/15 text-white/80 px-4 py-2 rounded text-sm font-semibold uppercase tracking-wider transition-all" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Sync Roster
              </button>
            </form>
            <form action="/api/cron/scrape-schedule" method="POST">
              <button className="bg-white/10 hover:bg-white/15 text-white/80 px-4 py-2 rounded text-sm font-semibold uppercase tracking-wider transition-all" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Sync Schedule
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
