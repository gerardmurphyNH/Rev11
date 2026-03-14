'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatMatchDate, formatMatchTime } from '@/lib/utils'

interface Match {
  id: string
  opponent: string
  match_date: string
  is_home: boolean
  competition: string
  status: string
  venue: string | null
}

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [newMatch, setNewMatch] = useState({
    opponent: '',
    match_date: '',
    is_home: true,
    competition: 'MLS',
    venue: '',
  })
  const [saving, setSaving] = useState(false)

  const loadMatches = async () => {
    const data = await fetch('/api/matches').then(r => r.json())
    setMatches(data.matches || [])
    setLoading(false)
  }

  useEffect(() => { loadMatches() }, [])

  const addMatch = async () => {
    if (!newMatch.opponent || !newMatch.match_date) return
    setSaving(true)
    await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newMatch,
        venue: newMatch.is_home ? (newMatch.venue || 'Gillette Stadium') : newMatch.venue || null,
      }),
      credentials: 'include',
    })
    await loadMatches()
    setNewMatch({ opponent: '', match_date: '', is_home: true, competition: 'MLS', venue: '' })
    setSaving(false)
  }

  const updateStatus = async (matchId: string, status: string) => {
    await fetch('/api/admin/matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: matchId, status }),
      credentials: 'include',
    })
    await loadMatches()
  }

  return (
    <div className="min-h-screen bg-[#0A2240] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>Match Management</h1>
          <Link href="/admin" className="text-[#C5A55A] text-sm hover:underline">← Admin</Link>
        </div>

        {/* Add match */}
        <div className="bg-[#0D2D52] border border-white/10 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#C5A55A] mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>Add Match</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <input
              value={newMatch.opponent}
              onChange={e => setNewMatch(p => ({ ...p, opponent: e.target.value }))}
              placeholder="Opponent (e.g. Inter Miami)"
              className="col-span-2 bg-white/5 border border-white/20 rounded px-3 py-2 text-[#F5F0E8] placeholder-white/30 text-sm focus:outline-none focus:border-[#CE0E2D]"
            />
            <input
              type="datetime-local"
              value={newMatch.match_date}
              onChange={e => setNewMatch(p => ({ ...p, match_date: e.target.value }))}
              className="bg-white/5 border border-white/20 rounded px-3 py-2 text-[#F5F0E8] text-sm focus:outline-none focus:border-[#CE0E2D]"
            />
            <select
              value={newMatch.competition}
              onChange={e => setNewMatch(p => ({ ...p, competition: e.target.value }))}
              className="bg-white/5 border border-white/20 rounded px-3 py-2 text-[#F5F0E8] text-sm focus:outline-none focus:border-[#CE0E2D]"
            >
              {['MLS', 'US Open Cup', 'Leagues Cup', 'Friendly'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="flex items-center gap-2 text-white/60 text-sm">
              <input
                type="checkbox"
                checked={newMatch.is_home}
                onChange={e => setNewMatch(p => ({ ...p, is_home: e.target.checked }))}
                className="accent-[#CE0E2D]"
              />
              Home game
            </label>
          </div>
          <button
            onClick={addMatch}
            disabled={!newMatch.opponent || !newMatch.match_date || saving}
            className="bg-[#CE0E2D] text-white px-6 py-2 rounded text-sm font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-[#A50B24] transition-all"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Add Match
          </button>
        </div>

        {/* Matches list */}
        {loading ? (
          <div className="text-center py-8 text-white/40">Loading...</div>
        ) : (
          <div className="space-y-2">
            {matches.map(match => (
              <div key={match.id} className="flex items-center gap-3 p-3 bg-[#0D2D52] rounded-lg border border-white/10">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-[#F5F0E8] uppercase truncate" style={{ fontFamily: "'Oswald', sans-serif" }}>
                    {match.is_home ? 'vs' : '@'} {match.opponent}
                  </p>
                  <p className="text-xs text-white/40">{formatMatchDate(match.match_date)} · {formatMatchTime(match.match_date)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded uppercase tracking-wider ${
                  match.status === 'completed' ? 'bg-green-900/30 text-green-400' :
                  match.status === 'locked' ? 'bg-yellow-900/30 text-yellow-400' :
                  'bg-[#CE0E2D]/20 text-[#CE0E2D]'
                }`} style={{ fontFamily: "'Oswald', sans-serif" }}>
                  {match.status}
                </span>
                <Link
                  href={`/admin/lineup/${match.id}`}
                  className="text-xs text-[#C5A55A] hover:underline uppercase tracking-wider"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  Lineup
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
