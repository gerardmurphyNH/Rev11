'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PlayerCard from './PlayerCard'
import LineupSlot from './LineupSlot'
import { groupPlayersByPosition } from '@/lib/utils'

interface Player {
  id: string
  name: string
  jersey_number: number | null
  position: string | null
  headshot_url: string | null
}

interface LineupPickerProps {
  matchId: string
  players: Player[]
  initialPicks?: string[]
  isLocked: boolean
}

const POSITION_LABELS: Record<string, string> = {
  GK: '🧤 Goalkeepers',
  DEF: '🛡️ Defenders',
  MID: '⚙️ Midfielders',
  FWD: '⚡ Forwards',
}

export default function LineupPicker({ matchId, players, initialPicks = [], isLocked }: LineupPickerProps) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>(initialPicks)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitted, setSubmitted] = useState(initialPicks.length === 11)
  const [activeFilter, setActiveFilter] = useState<string>('ALL')
  const [showXI, setShowXI] = useState(false)

  const grouped = groupPlayersByPosition(players)
  const selectedPlayers = selectedIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[]

  const togglePlayer = (player: Player) => {
    if (isLocked) return
    setSelectedIds(prev => {
      if (prev.includes(player.id)) {
        return prev.filter(id => id !== player.id)
      }
      if (prev.length >= 11) return prev
      return [...prev, player.id]
    })
    setSaved(false)
  }

  const saveLineup = async () => {
    if (selectedIds.length === 0) return
    setSaving(true)
    try {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, playerIds: selectedIds }),
        credentials: 'include',
      })
      if (res.ok) {
        setSaved(true)
        if (selectedIds.length === 11) {
          setSubmitted(true)
          setTimeout(() => router.push('/leaderboard'), 1500)
        } else {
          setTimeout(() => setSaved(false), 3000)
        }
      }
    } catch {
      alert('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const filteredPlayers = activeFilter === 'ALL' ? players : players.filter(p => p.position === activeFilter)

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-0">
      {/* Left: Player roster */}
      <div className="flex-1 min-w-0">
        {/* Position filter */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {['ALL', 'GK', 'DEF', 'MID', 'FWD'].map(pos => (
            <button
              key={pos}
              onClick={() => setActiveFilter(pos)}
              className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                activeFilter === pos
                  ? 'bg-[#CE0E2D] text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Player list */}
        <div className="space-y-1.5">
          {filteredPlayers.map(player => (
            <PlayerCard
              key={player.id}
              player={player}
              isSelected={selectedIds.includes(player.id)}
              onToggle={togglePlayer}
              disabled={selectedIds.length >= 11 && !selectedIds.includes(player.id)}
            />
          ))}
        </div>
      </div>

      {/* Right: Your XI */}
      <div className="lg:w-72 lg:flex-shrink-0">
        <div className="lg:sticky lg:top-4 bg-[#061629] rounded-lg border border-white/10 p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-sm font-bold uppercase tracking-widest text-[#C5A55A]"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Your Starting XI
            </h3>
            <span
              className={`text-lg font-bold ${selectedIds.length === 11 ? 'text-[#C5A55A]' : 'text-white/40'}`}
              style={{ fontFamily: 'Courier New, monospace' }}
            >
              {selectedIds.length}/11
            </span>
          </div>

          {/* Slots */}
          <div className="space-y-1.5 mb-4">
            {Array.from({ length: 11 }, (_, i) => (
              <LineupSlot
                key={i}
                slot={i + 1}
                player={selectedPlayers[i] || null}
                onRemove={isLocked ? undefined : (id) => setSelectedIds(prev => prev.filter(pid => pid !== id))}
              />
            ))}
          </div>

          {/* Submit button */}
          {!isLocked && (
            <button
              onClick={saveLineup}
              disabled={saving || selectedIds.length === 0}
              className={`
                w-full py-3 rounded-lg font-bold uppercase tracking-widest text-sm transition-all
                ${selectedIds.length === 11
                  ? 'bg-[#CE0E2D] text-white hover:bg-[#A50B24] active:scale-95'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
                }
                ${saving ? 'opacity-60 cursor-wait' : ''}
              `}
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : saved ? (
                <span className="flex items-center justify-center gap-2">
                  <span>✓</span>
                  {submitted ? 'Picks Submitted!' : 'Saved!'}
                </span>
              ) : submitted ? (
                '✏️ Edit Picks'
              ) : selectedIds.length === 11 ? (
                '⚔️ Submit Picks'
              ) : (
                `Pick ${11 - selectedIds.length} more`
              )}
            </button>
          )}

          {isLocked && (
            <div className="text-center py-3">
              <p className="text-[#CE0E2D] text-sm font-bold uppercase tracking-wider animate-lock-pulse" style={{ fontFamily: "'Oswald', sans-serif" }}>
                🔒 Lineup Locked
              </p>
            </div>
          )}

          {/* Pick confirmation message */}
          {submitted && !isLocked && (
            <p className="text-center text-xs text-white/50 mt-2">
              Picks saved — edit anytime before kickoff.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
