import { Metadata } from 'next'
import Link from 'next/link'
import { cookies } from 'next/headers'
import ShareButtons from '@/components/ShareButtons'
import { createServerSupabase } from '@/lib/supabase'
import { formatMatchDate } from '@/lib/utils'

interface PageProps {
  params: Promise<{ matchId: string }>
  searchParams: Promise<{ userId?: string }>
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { matchId } = await params
  const { userId } = await searchParams
  const supabase = await createServerSupabase()
  const { data: match } = await supabase.from('matches').select('opponent, match_date').eq('id', matchId).single()

  let score = ''
  if (userId) {
    const { data: pred } = await supabase.from('predictions').select('points_earned').eq('match_id', matchId).eq('user_id', userId).maybeSingle()
    if (pred?.points_earned !== null && pred?.points_earned !== undefined) {
      score = ` — ${pred.points_earned}/11`
    }
  }

  const title = match ? `Rev11${score}: ${match.opponent}` : 'Rev11 — Starting XI Picks'
  const description = match
    ? `I predicted the NE Revolution vs ${match.opponent} lineup on Rev11${score}. Think you can do better?`
    : 'New England Revolution Starting XI Prediction Game'

  return {
    title,
    description,
    openGraph: { title, description, images: [`/api/og?matchId=${matchId}&userId=${userId || ''}`] },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export default async function SharePage({ params, searchParams }: PageProps) {
  const { matchId } = await params
  const { userId: shareUserId } = await searchParams

  const cookieStore = await cookies()
  const currentUserId = cookieStore.get('rev11_user_id')?.value

  const userId = shareUserId || currentUserId

  const supabase = await createServerSupabase()
  const { data: match } = await supabase.from('matches').select('*').eq('id', matchId).single()

  let prediction = null
  let pickedPlayers: { name: string; correct: boolean }[] = []

  if (userId && match) {
    const { data: pred } = await supabase.from('predictions').select('id, points_earned, is_perfect').eq('match_id', matchId).eq('user_id', userId).maybeSingle()
    prediction = pred

    if (pred) {
      const { data: picks } = await supabase.from('prediction_players').select('player_id').eq('prediction_id', pred.id)
      const pickedIds = (picks || []).map(p => p.player_id)

      const { data: correctLineup } = await supabase.from('correct_lineups').select('id').eq('match_id', matchId).eq('status', 'confirmed').maybeSingle()
      const correctIds = new Set<string>()
      if (correctLineup) {
        const { data: clp } = await supabase.from('correct_lineup_players').select('player_id').eq('correct_lineup_id', correctLineup.id)
        ;(clp || []).forEach(p => correctIds.add(p.player_id))
      }

      const { data: players } = await supabase.from('players').select('id, name').in('id', pickedIds)
      pickedPlayers = (players || []).map(p => ({ name: p.name, correct: correctIds.has(p.id) }))
    }
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0A2240] flex items-center justify-center">
        <p className="text-white/40">Match not found</p>
      </div>
    )
  }

  const correctCount = pickedPlayers.filter(p => p.correct).length

  return (
    <div className="min-h-screen bg-[#0A2240] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Share card */}
        <div className="bg-[#0D2D52] border border-[#C5A55A]/30 rounded-xl overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-[#0A2240] border-b border-[#CE0E2D] px-6 py-4 text-center">
            <h1 className="text-3xl font-black text-[#F5F0E8] tracking-widest uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>REV11</h1>
            <p className="text-[#C5A55A] text-xs tracking-widest uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>Starting XI Picks</p>
          </div>

          <div className="p-6">
            <p className="text-white/50 text-sm text-center mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
              {formatMatchDate(match.match_date)}
            </p>
            <h2 className="text-xl font-black text-[#F5F0E8] text-center uppercase tracking-wide mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
              {match.is_home ? 'vs' : '@'} {match.opponent}
            </h2>

            {prediction && (
              <div className="text-center mb-4">
                <div className="text-5xl font-black text-[#C5A55A]" style={{ fontFamily: 'Courier New, monospace' }}>
                  {correctCount}/11
                </div>
                {prediction.is_perfect && (
                  <p className="text-[#C5A55A] text-sm font-bold mt-1">🎯 Perfect Score!</p>
                )}
              </div>
            )}

            {pickedPlayers.length > 0 && (
              <div className="space-y-1">
                {pickedPlayers.map((p, i) => (
                  <div key={i} className={`flex items-center gap-2 text-sm ${p.correct ? 'text-green-400' : 'text-white/50'}`}>
                    <span>{p.correct ? '✓' : '✗'}</span>
                    <span style={{ fontFamily: "'Oswald', sans-serif" }}>{p.name}</span>
                  </div>
                ))}
              </div>
            )}

            {!prediction && (
              <div className="text-center text-white/40 py-4">
                <p className="text-sm">No picks for this match</p>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 px-6 py-3 text-center">
            <p className="text-white/30 text-xs">Think you can do better?</p>
          </div>
        </div>

        {/* Share buttons */}
        {prediction && match && (
          <ShareButtons
            score={correctCount}
            opponent={match.opponent}
            matchId={matchId}
          />
        )}

        <div className="text-center mt-6">
          <Link href="/" className="text-[#C5A55A] text-sm hover:underline">
            Join The Fort →
          </Link>
        </div>
      </div>
    </div>
  )
}
