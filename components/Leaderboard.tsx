'use client'

import { getOrdinal } from '@/lib/utils'

interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  total_points: number
  games_played: number
  perfect_scores: number
}

interface LeaderboardProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
}

export default function Leaderboard({ entries, currentUserId }: LeaderboardProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-white/40">
        <p className="text-4xl mb-3">⚔️</p>
        <p className="uppercase tracking-widest text-sm" style={{ fontFamily: "'Oswald', sans-serif" }}>
          The Fort Awaits Its First Fighter
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[400px]">
        <thead>
          <tr className="border-b border-white/10">
            <th
              className="text-left py-3 px-3 text-[10px] uppercase tracking-widest text-[#C5A55A]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Rank
            </th>
            <th
              className="text-left py-3 px-3 text-[10px] uppercase tracking-widest text-[#C5A55A]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Fighter
            </th>
            <th
              className="text-right py-3 px-3 text-[10px] uppercase tracking-widest text-[#C5A55A]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Pts
            </th>
            <th
              className="text-right py-3 px-3 text-[10px] uppercase tracking-widest text-[#C5A55A] hidden sm:table-cell"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              GP
            </th>
            <th
              className="text-right py-3 px-3 text-[10px] uppercase tracking-widest text-[#C5A55A] hidden sm:table-cell"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              🎯 Perfect
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCurrentUser = entry.user_id === currentUserId
            const isTop3 = entry.rank <= 3
            const medalColors = ['text-[#C5A55A]', 'text-gray-300', 'text-amber-600']

            return (
              <tr
                key={entry.user_id}
                className={`border-b transition-colors ${
                  isCurrentUser
                    ? 'border-[#CE0E2D]/30 bg-[#CE0E2D]/10'
                    : 'border-white/5 hover:bg-white/3'
                }`}
              >
                {/* Rank */}
                <td className="py-3 px-3">
                  <span
                    className={`font-bold text-sm ${
                      isTop3 ? medalColors[entry.rank - 1] : 'text-white/40'
                    }`}
                    style={{ fontFamily: 'Courier New, monospace' }}
                  >
                    {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : `#${entry.rank}`}
                  </span>
                </td>

                {/* Name */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold uppercase tracking-wide text-sm ${
                        isCurrentUser ? 'text-[#F5F0E8]' : 'text-white/80'
                      }`}
                      style={{ fontFamily: "'Oswald', sans-serif" }}
                    >
                      {entry.display_name}
                    </span>
                    {isCurrentUser && (
                      <span className="text-[10px] bg-[#CE0E2D]/20 text-[#CE0E2D] px-1.5 py-0.5 rounded uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
                        You
                      </span>
                    )}
                  </div>
                </td>

                {/* Points */}
                <td className="py-3 px-3 text-right">
                  <span
                    className={`font-bold text-sm ${isCurrentUser ? 'text-[#C5A55A]' : 'text-white/80'}`}
                    style={{ fontFamily: 'Courier New, monospace' }}
                  >
                    {entry.total_points}
                  </span>
                </td>

                {/* Games played */}
                <td className="py-3 px-3 text-right hidden sm:table-cell">
                  <span className="text-white/40 text-sm" style={{ fontFamily: 'Courier New, monospace' }}>
                    {entry.games_played}
                  </span>
                </td>

                {/* Perfect scores */}
                <td className="py-3 px-3 text-right hidden sm:table-cell">
                  <span className={`text-sm ${entry.perfect_scores > 0 ? 'text-[#C5A55A]' : 'text-white/20'}`} style={{ fontFamily: 'Courier New, monospace' }}>
                    {entry.perfect_scores > 0 ? `${entry.perfect_scores} 🎯` : '—'}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
