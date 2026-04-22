import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { getDisplayName, getOrdinal, formatMatchDate } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserPicksPage({ params }: PageProps) {
  const { id } = await params

  const cookieStore = await cookies()
  const viewerId = cookieStore.get('rev11_user_id')?.value
  const viewerEmail = cookieStore.get('rev11_user_email')?.value
  if (!viewerId && !viewerEmail) redirect('/auth/register')

  // Load the user being viewed
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, total_points, games_played, perfect_scores')
    .eq('id', id)
    .maybeSingle()

  if (!user) notFound()

  const isOwnProfile = viewerId === id

  // Get rank
  const { count } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gt('total_points', user.total_points)
  const rank = (count || 0) + 1

  // Load their predictions with match info, newest first
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select(`
      id, points_earned, is_perfect, submitted_at,
      matches (id, opponent, match_date, competition, status, is_home)
    `)
    .eq('user_id', id)
    .order('submitted_at', { ascending: false })

  // Enrich each prediction with the player names and correct/incorrect status
  const enrichedPredictions = await Promise.all(
    (predictions || []).map(async (pred) => {
      const match = pred.matches as any
      const isCompleted = match?.status === 'completed'

      // Get picked players with names
      const { data: picks } = await supabaseAdmin
        .from('prediction_players')
        .select('player_id, players (id, name, position)')
        .eq('prediction_id', pred.id)

      // Get correct lineup if match is complete
      let correctPlayerIds = new Set<string>()
      if (isCompleted && match?.id) {
        const { data: correctLineup } = await supabaseAdmin
          .from('correct_lineups')
          .select('id')
          .eq('match_id', match.id)
          .eq('status', 'confirmed')
          .maybeSingle()

        if (correctLineup) {
          const { data: correctPlayers } = await supabaseAdmin
            .from('correct_lineup_players')
            .select('player_id')
            .eq('correct_lineup_id', correctLineup.id)
          correctPlayerIds = new Set((correctPlayers || []).map((p) => p.player_id))
        }
      }

      const enrichedPicks = (picks || []).map((p) => ({
        player_id: p.player_id,
        name: (p.players as any)?.name ?? 'Unknown',
        position: (p.players as any)?.position ?? null,
        correct: isCompleted && correctPlayerIds.size > 0 ? correctPlayerIds.has(p.player_id) : null,
      }))

      return { ...pred, picks: enrichedPicks }
    })
  )

  const scoredPredictions = enrichedPredictions.filter((p) => p.points_earned !== null)
  const avgScore =
    scoredPredictions.length > 0
      ? (
          scoredPredictions.reduce((sum, p) => sum + (p.points_earned || 0), 0) /
          scoredPredictions.length
        ).toFixed(1)
      : null

  return (
    <div className="min-h-screen bg-[#0A2240]">
      <Navigation />
      <main className="md:ml-64 px-4 py-6 max-w-2xl mx-auto md:mx-0 md:px-8 pb-24 md:pb-8">
        {/* Back */}
        <Link
          href="/leaderboard"
          className="text-white/30 text-xs uppercase tracking-wider hover:text-white/60 mb-6 inline-flex items-center gap-1 transition-colors"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          ← Leaderboard
        </Link>

        {/* Header */}
        <div className="mb-6 mt-4">
          <h1
            className="text-3xl font-black text-[#F5F0E8] uppercase tracking-widest"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {getDisplayName(user)}
          </h1>
          {isOwnProfile && (
            <p className="text-white/40 text-sm mt-0.5">{user.email}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Rank', value: getOrdinal(rank), color: 'text-[#CE0E2D]', mono: false },
            { label: 'Points', value: user.total_points, color: 'text-[#C5A55A]', mono: true },
            { label: 'Games', value: user.games_played, color: 'text-white/80', mono: true },
            { label: 'Perfect', value: user.perfect_scores > 0 ? `${user.perfect_scores} 🎯` : '0', color: 'text-[#C5A55A]', mono: true },
          ].map(({ label, value, color, mono }) => (
            <div key={label} className="bg-[#0D2D52] rounded-lg border border-white/10 p-4 text-center">
              <p
                className="text-xs uppercase tracking-widest text-white/40 mb-1"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {label}
              </p>
              <p
                className={`text-2xl font-black ${color}`}
                style={{ fontFamily: mono ? 'Courier New, monospace' : "'Oswald', sans-serif" }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>

        {avgScore && (
          <div className="mb-6 bg-[#0D2D52] rounded-lg border border-white/10 p-4 flex items-center justify-between">
            <span className="text-white/60 text-sm">Average score per match</span>
            <span
              className="text-xl font-bold text-[#C5A55A]"
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              {avgScore}/11
            </span>
          </div>
        )}

        {/* Pick history */}
        <h2
          className="text-xs uppercase tracking-widest text-[#C5A55A] mb-3"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Pick History
        </h2>

        {enrichedPredictions.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <p className="text-4xl mb-3">⚔️</p>
            <p className="text-sm uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
              No picks submitted yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrichedPredictions.map((pred) => {
              const match = pred.matches as any
              if (!match) return null
              const isCompleted = match.status === 'completed'

              const correctPicks = pred.picks.filter((p) => p.correct === true)
              const wrongPicks = pred.picks.filter((p) => p.correct === false)

              return (
                <div
                  key={pred.id}
                  className="bg-[#0D2D52] rounded-lg border border-white/10 overflow-hidden"
                >
                  {/* Match header */}
                  <div className="px-4 py-3 flex items-center justify-between border-b border-white/5">
                    <div>
                      <p
                        className="font-semibold uppercase text-sm text-[#F5F0E8]"
                        style={{ fontFamily: "'Oswald', sans-serif" }}
                      >
                        {match.is_home ? 'vs' : '@'} {match.opponent}
                      </p>
                      <p className="text-xs text-white/40">
                        {formatMatchDate(match.match_date)} · {match.competition}
                      </p>
                    </div>
                    {isCompleted && pred.points_earned !== null ? (
                      <div className="text-right">
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
                      <span
                        className="text-white/30 text-xs uppercase"
                        style={{ fontFamily: "'Oswald', sans-serif" }}
                      >
                        {match.status === 'upcoming' ? 'Open' : '🔒 Locked'}
                      </span>
                    )}
                  </div>

                  {/* Picks */}
                  <div className="px-4 py-3">
                    {pred.picks.length === 0 ? (
                      <p className="text-white/30 text-xs italic">No picks recorded</p>
                    ) : isCompleted && (correctPicks.length > 0 || wrongPicks.length > 0) ? (
                      <div className="space-y-2">
                        {correctPicks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {correctPicks.map((pick) => (
                              <span
                                key={pick.player_id}
                                className="text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wide bg-green-900/30 text-green-400 border border-green-500/30"
                                style={{ fontFamily: "'Oswald', sans-serif" }}
                              >
                                ✓ {pick.name}
                              </span>
                            ))}
                          </div>
                        )}
                        {wrongPicks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {wrongPicks.map((pick) => (
                              <span
                                key={pick.player_id}
                                className="text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wide bg-red-900/20 text-red-400/70 border border-red-500/20"
                                style={{ fontFamily: "'Oswald', sans-serif" }}
                              >
                                ✗ {pick.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      // Upcoming/locked — show plain picks without correct/incorrect
                      <div className="flex flex-wrap gap-1.5">
                        {pred.picks.map((pick) => (
                          <span
                            key={pick.player_id}
                            className="text-xs px-2 py-0.5 rounded font-semibold uppercase tracking-wide bg-white/5 text-white/60 border border-white/10"
                            style={{ fontFamily: "'Oswald', sans-serif" }}
                          >
                            {pick.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
