import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { createServerSupabase } from '@/lib/supabase'
import { getDisplayName, getOrdinal, formatMatchDate } from '@/lib/utils'

export default async function ProfilePage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('rev11_user_id')?.value
  if (!userId) redirect('/auth/register')

  const supabase = await createServerSupabase()

  const [{ data: user }, { data: predictions }] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase
      .from('predictions')
      .select(`
        id, points_earned, is_perfect,
        matches (id, opponent, match_date, competition, status)
      `)
      .eq('user_id', userId)
      .order('submitted_at', { ascending: false }),
  ])

  if (!user) redirect('/auth/register')

  // Get rank
  const { count } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gt('total_points', user.total_points)
  const rank = (count || 0) + 1

  const scoredPredictions = (predictions || []).filter(p => p.points_earned !== null)
  const avgScore = scoredPredictions.length > 0
    ? (scoredPredictions.reduce((sum, p) => sum + (p.points_earned || 0), 0) / scoredPredictions.length).toFixed(1)
    : '—'

  return (
    <div className="min-h-screen bg-[#0A2240]">
      <Navigation />
      <main className="md:ml-64 px-4 py-6 max-w-2xl mx-auto md:mx-0 md:px-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>
              {getDisplayName(user)}
            </h1>
            <p className="text-white/40 text-sm mt-0.5">{user.email}</p>
          </div>
          <Link
            href="/api/auth/logout"
            className="text-xs uppercase tracking-wider text-white/30 hover:text-white/60 transition-colors"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Sign Out
          </Link>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Rank', value: getOrdinal(rank), color: 'text-[#CE0E2D]' },
            { label: 'Points', value: user.total_points, color: 'text-[#C5A55A]' },
            { label: 'Games', value: user.games_played, color: 'text-white/80' },
            { label: 'Perfect', value: user.perfect_scores, color: 'text-[#C5A55A]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#0D2D52] rounded-lg border border-white/10 p-4 text-center">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {label}
              </p>
              <p className={`text-2xl font-black ${color}`} style={{ fontFamily: label === 'Rank' ? "'Oswald', sans-serif" : 'Courier New, monospace' }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Avg score */}
        {user.games_played > 0 && (
          <div className="mb-6 bg-[#0D2D52] rounded-lg border border-white/10 p-4 flex items-center justify-between">
            <span className="text-white/60 text-sm">Average score per match</span>
            <span className="text-xl font-bold text-[#C5A55A]" style={{ fontFamily: 'Courier New, monospace' }}>{avgScore}/11</span>
          </div>
        )}

        {/* Match history */}
        <div>
          <h2 className="text-xs uppercase tracking-widest text-[#C5A55A] mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Match History
          </h2>
          {predictions && predictions.length > 0 ? (
            <div className="space-y-2">
              {predictions.map(pred => {
                const match = pred.matches as any
                if (!match) return null
                return (
                  <Link
                    key={pred.id}
                    href={`/matches/${match.id}`}
                    className="flex items-center gap-3 p-3 bg-[#0D2D52] rounded-lg border border-white/10 hover:border-white/20 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold uppercase text-sm text-[#F5F0E8] truncate" style={{ fontFamily: "'Oswald', sans-serif" }}>
                        vs {match.opponent}
                      </p>
                      <p className="text-xs text-white/40">{formatMatchDate(match.match_date)} · {match.competition}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {pred.points_earned !== null ? (
                        <div>
                          <span
                            className={`text-lg font-bold ${pred.is_perfect ? 'text-[#C5A55A]' : 'text-white/80'}`}
                            style={{ fontFamily: 'Courier New, monospace' }}
                          >
                            {pred.points_earned}
                          </span>
                          <span className="text-white/40 text-xs"> pts</span>
                          {pred.is_perfect && <span className="ml-1">🎯</span>}
                        </div>
                      ) : (
                        <span className="text-white/30 text-xs uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
                          {match.status === 'completed' ? 'N/A' : 'Pending'}
                        </span>
                      )}
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10 text-white/40">
              <p className="text-3xl mb-3">⚔️</p>
              <p className="text-sm uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>No picks yet</p>
              <Link href="/" className="text-[#C5A55A] text-sm mt-2 inline-block hover:underline">
                Make your first picks →
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
