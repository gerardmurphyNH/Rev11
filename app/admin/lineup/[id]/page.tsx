'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'

interface Player {
  id: string
  name: string
  jersey_number: number | null
  position: string | null
}

export default function AdminLineupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [players, setPlayers] = useState<Player[]>([])
  const [match, setMatch] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [existingLineup, setExistingLineup] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [scoring, setScoring] = useState(false)
  const [message, setMessage] = useState('')
  const [finalRevsScore, setFinalRevsScore] = useState<string>('')
  const [finalOppScore, setFinalOppScore] = useState<string>('')

  useEffect(() => {
    Promise.all([
      fetch('/api/roster').then(r => r.json()),
      fetch(`/api/matches/${id}`).then(r => r.json()),
    ]).then(([rosterData, matchData]) => {
      setPlayers(rosterData.players || [])
      setMatch(matchData.match)
      if (matchData.correctLineup) {
        setExistingLineup(matchData.correctLineup)
        setSelectedIds(matchData.correctLineupPlayerIds || [])
      }
      if (matchData.match?.revs_score != null) setFinalRevsScore(String(matchData.match.revs_score))
      if (matchData.match?.opp_score != null) setFinalOppScore(String(matchData.match.opp_score))
    })
  }, [id])

  const togglePlayer = (playerId: string) => {
    setSelectedIds(prev =>
      prev.includes(playerId) ? prev.filter(pid => pid !== playerId) : prev.length < 11 ? [...prev, playerId] : prev
    )
  }

  const saveLineup = async (confirm = false) => {
    if (selectedIds.length !== 11) {
      setMessage('Select exactly 11 players.')
      return
    }
    setSaving(true)
    setMessage('')
    const revsNum = finalRevsScore !== '' ? parseInt(finalRevsScore, 10) : undefined
    const oppNum = finalOppScore !== '' ? parseInt(finalOppScore, 10) : undefined
    const res = await fetch('/api/admin/lineup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId: id,
        playerIds: selectedIds,
        confirm,
        ...(revsNum !== undefined && !isNaN(revsNum) && oppNum !== undefined && !isNaN(oppNum)
          ? { revsScore: revsNum, oppScore: oppNum }
          : {}),
      }),
      credentials: 'include',
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(confirm ? '✓ Lineup confirmed and scoring triggered!' : '✓ Lineup saved as pending.')
      setExistingLineup(data.lineup)
    } else {
      setMessage(`Error: ${data.error}`)
    }
    setSaving(false)
  }

  const triggerScoring = async () => {
    setScoring(true)
    const res = await fetch('/api/admin/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: id }),
      credentials: 'include',
    })
    const data = await res.json()
    setMessage(res.ok ? `✓ Scored ${data.scored} predictions.` : `Error: ${data.error}`)
    setScoring(false)
  }

  return (
    <div className="min-h-screen bg-[#0A2240] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Lineup Entry
            </h1>
            {match && (
              <p className="text-[#C5A55A] text-sm mt-0.5">vs {match.opponent}</p>
            )}
          </div>
          <Link href="/admin/matches" className="text-[#C5A55A] text-sm hover:underline">← Matches</Link>
        </div>

        {existingLineup && (
          <div className={`mb-4 p-3 rounded-lg border text-sm ${
            existingLineup.status === 'confirmed'
              ? 'bg-green-900/20 border-green-500/30 text-green-400'
              : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
          }`}>
            Status: <strong className="uppercase">{existingLineup.status}</strong>
            {existingLineup.confirmed_by && ` · Confirmed by ${existingLineup.confirmed_by}`}
          </div>
        )}

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.startsWith('✓') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-[#CE0E2D]'}`}>
            {message}
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-white/60">{selectedIds.length}/11 selected</span>
          {selectedIds.length > 0 && (
            <button onClick={() => setSelectedIds([])} className="text-xs text-white/40 hover:text-white/70">
              Clear all
            </button>
          )}
        </div>

        {/* Player grid */}
        <div className="space-y-1.5 mb-6">
          {players.map(player => {
            const selected = selectedIds.includes(player.id)
            return (
              <button
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                disabled={!selected && selectedIds.length >= 11}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  selected ? 'border-[#C5A55A] bg-[#C5A55A]/10' : 'border-white/10 bg-[#0D2D52] hover:border-white/20 disabled:opacity-40'
                }`}
              >
                <span className="w-6 text-xs text-center text-white/40 font-mono">{player.jersey_number ?? '—'}</span>
                <span className="flex-1 text-sm font-semibold text-[#F5F0E8] uppercase tracking-wide" style={{ fontFamily: "'Oswald', sans-serif" }}>
                  {player.name}
                </span>
                <span className="text-xs text-white/40">{player.position}</span>
                {selected && <span className="text-[#C5A55A]">✓</span>}
              </button>
            )
          })}
        </div>

        {/* Final score entry */}
        <div className="mb-4 p-4 bg-[#0D2D52] rounded-lg border border-white/10">
          <p className="text-xs uppercase tracking-widest text-[#C5A55A] mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Final Score <span className="text-white/30 normal-case tracking-normal">(required to score predictions)</span>
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>Revs</p>
              <input
                type="number"
                min={0}
                max={20}
                value={finalRevsScore}
                onChange={e => setFinalRevsScore(e.target.value)}
                placeholder="—"
                className="w-full text-center bg-[#0A2240] border border-white/20 rounded px-2 py-2 text-[#F5F0E8] text-xl font-bold focus:outline-none focus:border-[#C5A55A]"
                style={{ fontFamily: 'Courier New, monospace' }}
              />
            </div>
            <span className="text-white/30 text-xl font-bold pb-1">–</span>
            <div className="flex-1 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>{match?.opponent ?? 'Opponent'}</p>
              <input
                type="number"
                min={0}
                max={20}
                value={finalOppScore}
                onChange={e => setFinalOppScore(e.target.value)}
                placeholder="—"
                className="w-full text-center bg-[#0A2240] border border-white/20 rounded px-2 py-2 text-[#F5F0E8] text-xl font-bold focus:outline-none focus:border-[#C5A55A]"
                style={{ fontFamily: 'Courier New, monospace' }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => saveLineup(false)}
            disabled={saving || selectedIds.length !== 11}
            className="bg-white/10 text-white px-6 py-2.5 rounded font-bold uppercase tracking-wider text-sm disabled:opacity-50 hover:bg-white/15 transition-all"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Save as Pending
          </button>
          <button
            onClick={() => saveLineup(true)}
            disabled={saving || selectedIds.length !== 11}
            className="bg-[#C5A55A] text-[#0A2240] px-6 py-2.5 rounded font-bold uppercase tracking-wider text-sm disabled:opacity-50 hover:bg-[#D4B870] transition-all"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            ✓ Confirm & Score
          </button>
          {existingLineup?.status === 'confirmed' && (
            <button
              onClick={triggerScoring}
              disabled={scoring}
              className="bg-[#CE0E2D] text-white px-6 py-2.5 rounded font-bold uppercase tracking-wider text-sm disabled:opacity-50 hover:bg-[#A50B24] transition-all"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Re-run Scoring
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
