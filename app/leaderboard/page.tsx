import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Navigation from '@/components/Navigation'
import LeaderboardComponent from '@/components/Leaderboard'
import { createServerSupabase } from '@/lib/supabase'
import { getDisplayName, getOrdinal } from '@/lib/utils'

export default async function LeaderboardPage() {
  const cookieStore = await cookies()
  const userId = cookieStore.get('rev11_user_id')?.value
  if (!userId) redirect('/auth/register')

  const supabase = await createServerSupabase()

  const { data: users } = await supabase
    .from('users')
    .select('id, email, display_name, total_points, games_played, perfect_scores')
    .order('total_points', { ascending: false })
    .order('perfect_scores', { ascending: false })
    .order('games_played', { ascending: true })

  const entries = (users || []).map((user, index) => ({
    rank: index + 1,
    user_id: user.id,
    display_name: getDisplayName(user),
    total_points: user.total_points,
    games_played: user.games_played,
    perfect_scores: user.perfect_scores,
  }))

  const currentUserEntry = entries.find(e => e.user_id === userId)

  return (
    <div className="min-h-screen bg-[#0A2240]">
      <Navigation />
      <main className="md:ml-64 px-4 py-6 max-w-2xl mx-auto md:mx-0 md:px-8 pb-24 md:pb-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>
            The Fort Leaderboard
          </h1>
          <p className="text-white/50 text-sm mt-1">2026 MLS Season</p>
        </div>

        {/* Current user position banner */}
        {currentUserEntry && (
          <div className="mb-6 bg-[#CE0E2D]/10 border border-[#CE0E2D]/30 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#CE0E2D] mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Your Position
              </p>
              <p className="text-2xl font-black text-[#F5F0E8]" style={{ fontFamily: "'Oswald', sans-serif" }}>
                {getOrdinal(currentUserEntry.rank)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-widest text-white/40 mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>Points</p>
              <p className="text-2xl font-black text-[#C5A55A]" style={{ fontFamily: 'Courier New, monospace' }}>
                {currentUserEntry.total_points}
              </p>
            </div>
          </div>
        )}

        {/* Scoring guide */}
        <div className="mb-6 bg-[#0D2D52] rounded-lg border border-white/10 p-4">
          <h2 className="text-xs uppercase tracking-widest text-[#C5A55A] mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Scoring
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[#C5A55A]">⚽</span>
              <span className="text-white/70 text-sm">1 point per correct player</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#C5A55A]">🎯</span>
              <span className="text-white/70 text-sm">11/11 = 14 pts (+3 bonus)</span>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-[#0D2D52] rounded-lg border border-white/10 overflow-hidden">
          <LeaderboardComponent entries={entries} currentUserId={userId} />
        </div>
      </main>
    </div>
  )
}
