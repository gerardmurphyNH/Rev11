import Link from 'next/link'
import { formatMatchDate, formatMatchTime, isMatchLocked } from '@/lib/utils'
import CountdownTimer from './CountdownTimer'

interface Match {
  id: string
  opponent: string
  match_date: string
  is_home: boolean
  venue: string | null
  competition: string
  status: string
}

interface MatchCardProps {
  match: Match
  predictionStatus?: 'none' | 'saved' | 'locked'
  pointsEarned?: number | null
}

export default function MatchCard({ match, predictionStatus = 'none', pointsEarned }: MatchCardProps) {
  const locked = isMatchLocked(match.match_date) || match.status === 'locked' || match.status === 'completed'
  const isCompleted = match.status === 'completed'

  return (
    <Link href={`/matches/${match.id}`} className="block group">
      <div
        className={`relative overflow-hidden rounded-lg border transition-all duration-200 ${
          isCompleted
            ? 'border-[#C5A55A]/30 bg-[#061629]'
            : locked
            ? 'border-[#CE0E2D]/30 bg-[#0D2D52]/80'
            : 'border-white/10 bg-[#0D2D52] hover:border-white/20 hover:bg-[#0D2D52]/90 active:scale-[0.99]'
        }`}
      >
        {/* Red diagonal stripe on completed/locked */}
        {locked && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-0 right-0 w-1 h-full"
              style={{ background: isCompleted ? '#C5A55A' : '#CE0E2D', opacity: 0.4 }}
            />
          </div>
        )}

        <div className="p-4">
          {/* Competition badge */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[10px] uppercase tracking-widest text-[#C5A55A] font-semibold"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {match.competition}
            </span>
            {isCompleted && pointsEarned !== null && pointsEarned !== undefined ? (
              <span
                className="text-xs font-bold text-[#C5A55A] bg-[#C5A55A]/10 px-2 py-0.5 rounded"
                style={{ fontFamily: 'Courier New, monospace' }}
              >
                {pointsEarned} pts
              </span>
            ) : locked ? (
              <span className="text-xs text-[#CE0E2D] uppercase tracking-wider animate-lock-pulse" style={{ fontFamily: "'Oswald', sans-serif" }}>
                🔒 Locked
              </span>
            ) : predictionStatus === 'saved' ? (
              <span className="text-xs text-green-400 uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
                ✓ Picks Saved
              </span>
            ) : (
              <span className="text-xs text-white/40 uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
                No Picks Yet
              </span>
            )}
          </div>

          {/* Match info */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm">{match.is_home ? 'vs' : '@'}</span>
                <h3
                  className="text-xl font-bold text-[#F5F0E8] uppercase tracking-wide"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {match.opponent}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-white/50 text-sm">{formatMatchDate(match.match_date)}</span>
                <span className="text-white/30 text-sm">·</span>
                <span className="text-white/50 text-sm">{formatMatchTime(match.match_date)}</span>
              </div>
              {match.venue && (
                <p className="text-white/30 text-xs mt-0.5">{match.venue}</p>
              )}
            </div>

            {/* Arrow or score */}
            {isCompleted ? (
              <div className="text-right">
                <div className="text-2xl font-bold text-[#C5A55A]" style={{ fontFamily: 'Courier New, monospace' }}>
                  {pointsEarned ?? '—'}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  pts
                </div>
              </div>
            ) : (
              <div className={`text-white/30 group-hover:text-white/60 transition-colors`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            )}
          </div>

          {/* Countdown for upcoming */}
          {!locked && !isCompleted && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <CountdownTimer matchDate={match.match_date} />
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
