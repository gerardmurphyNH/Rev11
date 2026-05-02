import { cookies } from 'next/headers'
import Link from 'next/link'
import Navigation from '@/components/Navigation'
import MatchCard from '@/components/MatchCard'
import { supabaseAdmin } from '@/lib/supabase'

async function getMatches() {
  try {
    const { data } = await supabaseAdmin
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true })
    return data || []
  } catch {
    return []
  }
}

async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('rev11_user_id')?.value
    const email = cookieStore.get('rev11_user_email')?.value

    if (!userId && !email) return null

    // Try by ID first
    if (userId) {
      const { data } = await supabaseAdmin.from('users').select('*').eq('id', userId).single()
      if (data) return data
    }

    // Stale or missing ID — recover by email
    if (email) {
      const { data: existing } = await supabaseAdmin.from('users').select('*').eq('email', email).maybeSingle()
      if (existing) return existing
      // Auto-recreate account (e.g. after a DB clear)
      const { data: created } = await supabaseAdmin.from('users').insert({ email }).select('*').single()
      return created ?? null
    }

    return null
  } catch {
    return null
  }
}

async function getUserPredictions(userId: string) {
  try {
    const { data } = await supabaseAdmin
      .from('predictions')
      .select('match_id, points_earned, is_locked')
      .eq('user_id', userId)
    return data || []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [matches, user] = await Promise.all([getMatches(), getCurrentUser()])
  const predictions = user ? await getUserPredictions(user.id) : []
  const predictionMap = new Map(predictions.map(p => [p.match_id, p]))
  const upcoming = matches.filter(m => m.status === 'upcoming' || m.status === 'locked')
  const completed = matches.filter(m => m.status === 'completed')

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0A2240] stripe-overlay">
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
          <div className="mb-8">
            <h1
              className="text-8xl font-black text-[#F5F0E8] tracking-widest uppercase"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              REV11
            </h1>
            <div className="h-1 bg-[#CE0E2D] mx-auto mt-2 mb-4" style={{ width: '60%' }} />
            <p
              className="text-[#C5A55A] text-sm tracking-[0.3em] uppercase"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              ★ Predict the Starting XI ★
            </p>
          </div>

          <div className="max-w-sm mb-10">
            <p className="text-[#F5F0E8]/80 text-lg leading-relaxed">
              Pick the New England Revolution&apos;s starting lineup before kickoff.
              Earn points. Climb The Fort&apos;s leaderboard. Bring the fight.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-xs mb-10 text-center">
            {[
              { icon: '⚔️', label: 'Pick 11' },
              { icon: '🏆', label: 'Earn Points' },
              { icon: '📋', label: 'Lead The Fort' },
            ].map(({ icon, label }) => (
              <div key={label}>
                <div className="text-3xl mb-1">{icon}</div>
                <p className="text-xs uppercase tracking-wider text-white/50" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/auth/register"
            className="bg-[#CE0E2D] text-white px-10 py-4 rounded-lg font-black uppercase tracking-widest text-lg hover:bg-[#A50B24] transition-all active:scale-95 shadow-lg"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Join the Fight
          </Link>

          <Link
            href="/auth/register"
            className="mt-4 block px-6 py-3 text-[#C5A55A] text-base font-semibold hover:text-white transition-colors"
            style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: '0.05em' }}
          >
            Already have an account? <span className="underline underline-offset-2">Sign in →</span>
          </Link>

          <div className="absolute bottom-8 left-0 right-0 text-center">
            <p className="text-white/20 text-xs tracking-[0.4em] uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
              ★ The Fort ★ Midnight Riders ★ Bring the Fight ★
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A2240]">
      <Navigation />
      <main className="md:ml-64 pb-24 md:pb-8 px-4 py-6 max-w-2xl mx-auto md:mx-0 md:max-w-2xl md:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>
            The Fort
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Welcome back{user.display_name ? `, ${user.display_name}` : ''}. Make your picks before kickoff.
          </p>
        </div>

        {upcoming.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs uppercase tracking-widest text-[#C5A55A] mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
              ⚔️ Upcoming Matches
            </h2>
            <div className="space-y-3">
              {upcoming.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  predictionStatus={predictionMap.has(match.id) ? 'saved' : 'none'}
                />
              ))}
            </div>
          </section>
        )}

        {upcoming.length === 0 && (
          <div className="text-center py-16 text-white/40">
            <div className="text-5xl mb-4">⚔️</div>
            <p className="uppercase tracking-widest text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>No Upcoming Matches</p>
            <p className="text-sm mt-2">Check back soon. The fight continues.</p>
          </div>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-xs uppercase tracking-widest text-[#C5A55A] mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
              📋 Recent Results
            </h2>
            <div className="space-y-3">
              {completed.slice(0, 5).map(match => {
                const pred = predictionMap.get(match.id)
                return (
                  <MatchCard
                    key={match.id}
                    match={match}
                    predictionStatus={pred ? 'locked' : 'none'}
                    pointsEarned={pred?.points_earned}
                  />
                )
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
