'use client'

import { useState, useEffect } from 'react'

interface PlayerPick {
  id: string
  name: string
  position: string | null
}

interface UserPicks {
  user_id: string
  display_name: string
  points_earned: number | null
  score_points_earned: number | null
  predicted_revs_score: number | null
  predicted_opp_score: number | null
  is_perfect: boolean
  players: PlayerPick[]
}

interface CommunityPicksProps {
  matchId: string
  currentUserId: string
}

export default function CommunityPicks({ matchId, currentUserId }: CommunityPicksProps) {
  const [data, setData] = useState<{ picks: UserPicks[]; revs_score: number | null; opp_score: number | null } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/picks/${matchId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [matchId])

  if (!data?.picks?.length) return null

  return (
    <div className="mt-6">
      <h2
        className="text-xs uppercase tracking-widest text-[#C5A55A] mb-3"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        ⚔️ The Fort's Picks ({data.picks.length})
      </h2>

      <div className="space-y-2">
        {data.picks.map(entry => {
          const isMe = entry.user_id === currentUserId
          const isOpen = expanded === entry.user_id

          return (
            <div
              key={entry.user_id}
              className={`rounded-lg border overflow-hidden ${
                isMe ? 'border-[#CE0E2D]/40 bg-[#CE0E2D]/5' : 'border-white/10 bg-[#0D2D52]'
              }`}
            >
              {/* Row header — click to expand */}
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-all"
                onClick={() => setExpanded(isOpen ? null : entry.user_id)}
              >
                <span
                  className={`text-sm font-bold uppercase tracking-wide flex-1 truncate ${isMe ? 'text-[#CE0E2D]' : 'text-[#F5F0E8]'}`}
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {entry.display_name} {isMe && '(You)'}
                </span>

                {/* Score prediction */}
                {entry.predicted_revs_score != null && entry.predicted_opp_score != null && (
                  <span className="text-xs text-white/40 font-mono flex-shrink-0">
                    {entry.predicted_revs_score}–{entry.predicted_opp_score}
                  </span>
                )}

                {/* Points */}
                <span
                  className="text-sm font-bold flex-shrink-0"
                  style={{ fontFamily: 'Courier New, monospace' }}
                >
                  {entry.points_earned != null ? (
                    <span className={entry.is_perfect ? 'text-[#C5A55A]' : 'text-[#F5F0E8]'}>
                      {entry.points_earned} pts {entry.is_perfect ? '🎯' : ''}
                    </span>
                  ) : (
                    <span className="text-white/20">— pts</span>
                  )}
                </span>

                <span className={`text-white/30 text-xs flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Expanded player list */}
              {isOpen && (
                <div className="px-4 pb-3 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    {entry.players.map(player => (
                      <div key={player.id} className="flex items-center gap-1.5 py-0.5">
                        <span className="text-[10px] text-white/30 w-6 text-right flex-shrink-0">
                          {player.position ?? '—'}
                        </span>
                        <span
                          className="text-xs text-[#F5F0E8]/80 truncate"
                          style={{ fontFamily: "'Oswald', sans-serif" }}
                        >
                          {player.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  {entry.score_points_earned != null && entry.score_points_earned > 0 && (
                    <p className="text-xs text-green-400/70 mt-2">
                      +{entry.score_points_earned} pts from score prediction
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
