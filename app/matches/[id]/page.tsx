import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Navigation from '@/components/Navigation'
import LineupPicker from '@/components/LineupPicker'
import CountdownTimer from '@/components/CountdownTimer'
import ShareButtons from '@/components/ShareButtons'
import { supabaseAdmin } from '@/lib/supabase'
import { formatMatchDate, formatMatchTime, isMatchLocked } from '@/lib/utils'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MatchPage({ params }: PageProps) {
  const { id } = await params

  const cookieStore = await cookies()
  const userId = cookieStore.get('rev11_user_id')?.value
  const email = cookieStore.get('rev11_user_email')?.value
  if (!userId && !email) redirect('/auth/register')

  // Resolve user ID — fall back to email if cookie is stale
  let resolvedUserId = userId
  if (!resolvedUserId && email) {
    const { data: byEmail } = await supabaseAdmin.from('users').select('id').eq('email', email).maybeSingle()
    resolvedUserId = byEmail?.id ?? undefined
    if (!resolvedUserId) {
      const { data: created } = await supabaseAdmin.from('users').insert({ email }).select('id').single()
      resolvedUserId = created?.id ?? undefined
    }
  }
  if (!resolvedUserId) redirect('/auth/register')

  const [{ data: match }, { data: players }, { data: prediction }] = await Promise.all([
    supabaseAdmin.from('matches').select('*').eq('id', id).single(),
    supabaseAdmin.from('players').select('*').eq('is_active', true).order('position').order('name'),
    supabaseAdmin
      .from('predictions')
      .select('id, points_earned, is_perfect')
      .eq('match_id', id)
      .eq('user_id', resolvedUserId)
      .maybeSingle(),
  ])

  if (!match) notFound()

  const locked = isMatchLocked(match.match_date) || match.status === 'locked' || match.status === 'completed'
  const isCompleted = match.status === 'completed'

  // Get user's picked player IDs
  let pickedPlayerIds: string[] = []
  if (prediction) {
    const { data: picks } = await supabaseAdmin
      .from('prediction_players')
      .select('player_id')
      .eq('prediction_id', prediction.id)
    pickedPlayerIds = (picks || []).map(p => p.player_id)
  }

  // If completed, get correct lineup for results view
  let correctPlayerIds: Set<string> = new Set()
  if (isCompleted) {
    const { data: correctLineup } = await supabaseAdmin
      .from('correct_lineups')
      .select('id')
      .eq('match_id', id)
      .eq('status', 'confirmed')
      .maybeSingle()

    if (correctLineup) {
      const { data: correctPlayers } = await supabaseAdmin
        .from('correct_lineup_players')
        .select('player_id')
        .eq('correct_lineup_id', correctLineup.id)
      correctPlayerIds = new Set((correctPlayers || []).map(p => p.player_id))
    }
  }

  return (
    <div className="min-h-screen bg-[#0A2240]">
      <Navigation />
      <main className="md:ml-64 px-4 py-6 max-w-3xl mx-auto md:mx-0 md:px-8 pb-24 md:pb-8">
        {/* Match header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <p className="text-[#C5A55A] text-xs uppercase tracking-widest mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {match.competition}
              </p>
              <h1 className="text-3xl font-black text-[#F5F0E8] uppercase tracking-wide" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {match.is_home ? 'vs' : '@'} {match.opponent}
              </h1>
              <p className="text-white/50 text-sm mt-1">
                {formatMatchDate(match.match_date)} · {formatMatchTime(match.match_date)}
              </p>
              {match.venue && <p className="text-white/30 text-xs mt-0.5">{match.venue}</p>}
            </div>

            {!locked && (
              <div className="flex-shrink-0">
                <CountdownTimer matchDate={match.match_date} />
              </div>
            )}
          </div>

          {/* Status bar */}
          {isCompleted && prediction && (
            <div className="mt-4 bg-[#0D2D52] rounded-lg border border-[#C5A55A]/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#C5A55A] mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
                    Your Score
                  </p>
                  <p className="text-4xl font-black text-[#F5F0E8]" style={{ fontFamily: 'Courier New, monospace' }}>
                    {prediction.points_earned ?? '—'}
                    <span className="text-white/30 text-lg"> pts</span>
                  </p>
                  {prediction.is_perfect && (
                    <p className="text-[#C5A55A] text-sm font-bold mt-1">🎯 Perfect Score! +3 Bonus</p>
                  )}
                </div>
                <ShareButtons
                  score={pickedPlayerIds.filter(id => correctPlayerIds.has(id)).length}
                  opponent={match.opponent}
                  matchId={match.id}
                />
              </div>
            </div>
          )}
        </div>

        {/* Results view for completed match */}
        {isCompleted && correctPlayerIds.size > 0 && (
          <div className="mb-6 space-y-4">
            {/* Official lineup: correct picks (green ✓) and missed (gray ·) */}
            <div>
              <h2 className="text-xs uppercase tracking-widest text-[#C5A55A] mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {pickedPlayerIds.length > 0 ? 'Official Lineup — Your Picks' : 'Official Lineup'}
              </h2>
              <div className="space-y-1.5">
                {(players || [])
                  .filter(p => correctPlayerIds.has(p.id))
                  .map(player => {
                    const userPicked = pickedPlayerIds.includes(player.id)
                    return (
                      <div
                        key={player.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border ${
                          userPicked
                            ? 'bg-green-900/20 border-green-500/30'
                            : 'bg-white/5 border-white/10'
                        }`}
                      >
                        <span className={`text-lg flex-shrink-0 w-6 text-center ${userPicked ? 'text-green-400' : 'text-white/20'}`}>
                          {userPicked ? '✓' : '·'}
                        </span>
                        <span className={`font-semibold uppercase tracking-wide text-sm ${userPicked ? 'text-[#F5F0E8]' : 'text-white/50'}`} style={{ fontFamily: "'Oswald', sans-serif" }}>
                          {player.name}
                        </span>
                        {player.position && (
                          <span className="text-xs text-white/30 ml-auto">{player.position}</span>
                        )}
                        {!userPicked && pickedPlayerIds.length > 0 && (
                          <span className="text-xs text-white/20 uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>missed</span>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Wrong picks: players the user picked that were NOT in the correct lineup */}
            {pickedPlayerIds.length > 0 && (() => {
              const wrongPicks = (players || []).filter(
                p => pickedPlayerIds.includes(p.id) && !correctPlayerIds.has(p.id)
              )
              if (wrongPicks.length === 0) return null
              return (
                <div>
                  <h2 className="text-xs uppercase tracking-widest text-red-400/70 mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
                    Wrong Picks ({wrongPicks.length})
                  </h2>
                  <div className="space-y-1.5">
                    {wrongPicks.map(player => (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 p-2.5 rounded-lg border bg-red-900/10 border-red-500/20"
                      >
                        <span className="text-lg flex-shrink-0 w-6 text-center text-red-400/60">✗</span>
                        <span className="font-semibold uppercase tracking-wide text-sm text-white/40" style={{ fontFamily: "'Oswald', sans-serif" }}>
                          {player.name}
                        </span>
                        {player.position && (
                          <span className="text-xs text-white/20 ml-auto">{player.position}</span>
                        )}
                        <span className="text-xs text-red-400/50 uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
                          not selected
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {/* Completed match, no picks submitted */}
        {isCompleted && pickedPlayerIds.length === 0 && correctPlayerIds.size === 0 && (
          <div className="text-center py-12 text-white/40">
            <p className="text-4xl mb-3">📋</p>
            <p className="uppercase tracking-widest text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Match Complete — No Picks Submitted
            </p>
          </div>
        )}

        {/* Lineup picker for active matches */}
        {!isCompleted && (
          <LineupPicker
            matchId={match.id}
            players={players || []}
            initialPicks={pickedPlayerIds}
            isLocked={locked}
          />
        )}

        {/* Locked, no picks */}
        {locked && !isCompleted && pickedPlayerIds.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <p className="text-4xl mb-3">🔒</p>
            <p className="uppercase tracking-widest text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Match Locked — No Picks Submitted
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
