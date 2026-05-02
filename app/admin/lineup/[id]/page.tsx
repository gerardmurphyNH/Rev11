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
  const [scoringResult, setScoringResult] = useState(false)
  const [message, setMessage] = useState('')

  // Phase 2: final score state
  const [finalRevsScore, setFinalRevsScore] = useState<string>('')
  const [finalOppScore, setFinalOppScore] = useState<string>('')
  const [scoreSubmitted, setScoreSubmitted] = useState(false)

  const loadData = () => {
    return Promise.all([
      fetch('/api/roster').then(r => r.json()),
      fetch(`/api/matches/${id}`).then(r => r.json()),
    ]).then(([rosterData, matchData]) => {
      setPlayers(rosterData.players || [])
      setMatch(matchData.match)
      if (matchData.correctLineup) {
        setExistingLineup(matchData.correctLineup)
        setSelectedIds(matchData.correctLineupPlayerIds || [])
      }
      if (matchData.match?.revs_score != null) {
        setFinalRevsScore(String(matchData.match.revs_score))
        setScoreSubmitted(true)
      }
      if (matchData.match?.opp_score != null) {
        setFinalOppScore(String(matchData.match.opp_score))
      }
    })
  }

  useEffect(() => { loadData() }, [id])

  const togglePlayer = (playerId: string) => {
    setSelectedIds(prev =>
      prev.includes(playerId) ? prev.filter(pid => pid !== playerId) : prev.length < 11 ? [...prev, playerId] : prev
    )
  }

  // Phase 1: confirm correct lineup
  const saveLineup = async (confirm = false) => {
    if (selectedIds.length !== 11) { setMessage('Select exactly 11 players.'); return }
    setSaving(true)
    setMessage('')
    const res = await fetch('/api/admin/lineup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: id, playerIds: selectedIds, confirm }),
      credentials: 'include',
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(confirm
        ? `✓ Lineup confirmed — ${data.scored ?? 0} predictions scored. Now enter the final score below.`
        : '✓ Lineup saved as pending.')
      setExistingLineup(data.lineup)
      await loadData()
    } else {
      setMessage(`Error: ${data.error}`)
    }
    setSaving(false)
  }

  // Phase 2: submit final score and apply score prediction bonus points
  const submitFinalScore = async () => {
    const revsNum = parseInt(finalRevsScore, 10)
    const oppNum = parseInt(finalOppScore, 10)
    if (isNaN(revsNum) || isNaN(oppNum)) { setMessage('Enter a valid score for both teams.'); return }
    setScoringResult(true)
    setMessage('')
    const res = await fetch('/api/admin/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matchId: id, revsScore: revsNum, oppScore: oppNum }),
      credentials: 'include',
    })
    const data = await res.json()
    if (res.ok) {
      setMessage(`✓ Final score saved. Score prediction bonus applied to ${data.scored} predictions.`)
      setScoreSubmitted(true)
      await loadData()
    } else {
      setMessage(`Error: ${data.error}`)
    }
    setScoringResult(false)
  }

  const lineupConfirmed = existingLineup?.status === 'confirmed'

  return (
    <div className="min-h-screen bg-[#0A2240] p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Lineup Entry
            </h1>
            {match && <p className="text-[#C5A55A] text-sm mt-0.5">{match.is_home ? 'vs' : '@'} {match.opponent}</p>}
          </div>
          <Link href="/admin/matches" className="text-[#C5A55A] text-sm hover:underline">← Matches</Link>
        </div>

        {/* Status banner */}
        {existingLineup && (
          <div className={`mb-4 p-3 rounded-lg border text-sm ${
            lineupConfirmed
              ? 'bg-green-900/20 border-green-500/30 text-green-400'
              : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400'
          }`}>
            <span className="uppercase font-bold">Phase 1 — Lineup:</span>{' '}
            <span className="uppercase">{existingLineup.status}</span>
            {existingLineup.confirmed_by && ` · by ${existingLineup.confirmed_by}`}
            {lineupConfirmed && match?.revs_score != null && (
              <span className="ml-3">
                <span className="uppercase font-bold text-[#C5A55A]">Phase 2 — Score:</span>{' '}
                <span className="text-[#C5A55A]">Revs {match.revs_score} – {match.opp_score} {match.opponent} ✓</span>
              </span>
            )}
          </div>
        )}

        {/* Feedback message */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${message.startsWith('✓') ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-[#CE0E2D]'}`}>
            {message}
          </div>
        )}

        {/* ── PHASE 1: Player selection ── */}
        <div className={`mb-6 ${lineupConfirmed ? 'opacity-70' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs uppercase tracking-widest text-[#C5A55A]" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Phase 1 — Confirm Starting XI
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-white/60">{selectedIds.length}/11</span>
              {selectedIds.length > 0 && !lineupConfirmed && (
                <button onClick={() => setSelectedIds([])} className="text-xs text-white/40 hover:text-white/70">
                  Clear
                </button>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mb-4">
            {players.map(player => {
              const selected = selectedIds.includes(player.id)
              return (
                <button
                  key={player.id}
                  onClick={() => !lineupConfirmed && togglePlayer(player.id)}
                  disabled={lineupConfirmed || (!selected && selectedIds.length >= 11)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                    selected
                      ? 'border-[#C5A55A] bg-[#C5A55A]/10'
                      : 'border-white/10 bg-[#0D2D52] hover:border-white/20 disabled:opacity-40'
                  } ${lineupConfirmed ? 'cursor-default' : ''}`}
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

          {!lineupConfirmed && (
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
                {saving ? 'Saving…' : '✓ Confirm Lineup & Score Players'}
              </button>
            </div>
          )}

          {lineupConfirmed && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <span>✓</span>
              <span>Lineup locked — player pick points have been applied</span>
              <button
                onClick={() => saveLineup(true)}
                disabled={saving}
                className="ml-auto text-xs text-white/30 hover:text-white/60"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                Re-score lineup
              </button>
            </div>
          )}
        </div>

        {/* ── PHASE 2: Final score ── */}
        <div className={`p-4 rounded-lg border ${
          lineupConfirmed
            ? 'bg-[#0D2D52] border-[#C5A55A]/30'
            : 'bg-white/5 border-white/10 opacity-40 pointer-events-none'
        }`}>
          <h2 className="text-xs uppercase tracking-widest text-[#C5A55A] mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Phase 2 — Final Score
          </h2>
          <p className="text-white/40 text-xs mb-4">
            {lineupConfirmed
              ? 'Enter the actual scoreline after the match to apply score prediction bonus points (+7 max).'
              : 'Confirm the lineup first to unlock this step.'}
          </p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>Revs</p>
              <input
                type="number"
                min={0}
                max={20}
                value={finalRevsScore}
                onChange={e => { setFinalRevsScore(e.target.value); setScoreSubmitted(false) }}
                placeholder="—"
                className="w-full text-center bg-[#0A2240] border border-white/20 rounded px-2 py-2.5 text-[#F5F0E8] text-2xl font-bold focus:outline-none focus:border-[#C5A55A]"
                style={{ fontFamily: 'Courier New, monospace' }}
              />
            </div>
            <span className="text-white/30 text-2xl font-bold pb-1">–</span>
            <div className="flex-1 text-center">
              <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1" style={{ fontFamily: "'Oswald', sans-serif" }}>{match?.opponent ?? 'Opponent'}</p>
              <input
                type="number"
                min={0}
                max={20}
                value={finalOppScore}
                onChange={e => { setFinalOppScore(e.target.value); setScoreSubmitted(false) }}
                placeholder="—"
                className="w-full text-center bg-[#0A2240] border border-white/20 rounded px-2 py-2.5 text-[#F5F0E8] text-2xl font-bold focus:outline-none focus:border-[#C5A55A]"
                style={{ fontFamily: 'Courier New, monospace' }}
              />
            </div>
          </div>

          <button
            onClick={submitFinalScore}
            disabled={scoringResult || !finalRevsScore || !finalOppScore}
            className="w-full bg-[#CE0E2D] text-white py-2.5 rounded font-bold uppercase tracking-wider text-sm disabled:opacity-50 hover:bg-[#A50B24] transition-all"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {scoringResult ? 'Applying…' : scoreSubmitted ? '✓ Score Submitted — Re-submit to Update' : '⚽ Submit Final Score'}
          </button>
        </div>

      </div>
    </div>
  )
}
