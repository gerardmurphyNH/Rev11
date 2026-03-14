'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Player {
  id: string
  name: string
  jersey_number: number | null
  position: string | null
  is_active: boolean
}

export default function AdminRosterPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Player | null>(null)
  const [newPlayer, setNewPlayer] = useState({ name: '', jersey_number: '', position: 'MID' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/roster').then(r => r.json()).then(d => {
      setPlayers(d.players || [])
      setLoading(false)
    })
  }, [])

  const savePlayer = async (player: Partial<Player> & { id?: string }) => {
    setSaving(true)
    await fetch('/api/admin/roster', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(player),
      credentials: 'include',
    })
    const data = await fetch('/api/roster').then(r => r.json())
    setPlayers(data.players || [])
    setEditing(null)
    setSaving(false)
    setNewPlayer({ name: '', jersey_number: '', position: 'MID' })
  }

  const toggleActive = (player: Player) => {
    savePlayer({ id: player.id, is_active: !player.is_active })
  }

  return (
    <div className="min-h-screen bg-[#0A2240] p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>Roster Management</h1>
          <Link href="/admin" className="text-[#C5A55A] text-sm hover:underline">← Admin</Link>
        </div>

        {/* Add player */}
        <div className="bg-[#0D2D52] border border-white/10 rounded-lg p-4 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[#C5A55A] mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>Add Player</h2>
          <div className="flex gap-2 flex-wrap">
            <input
              value={newPlayer.name}
              onChange={e => setNewPlayer(p => ({ ...p, name: e.target.value }))}
              placeholder="Player name"
              className="flex-1 min-w-32 bg-white/5 border border-white/20 rounded px-3 py-2 text-[#F5F0E8] placeholder-white/30 text-sm focus:outline-none focus:border-[#CE0E2D]"
            />
            <input
              value={newPlayer.jersey_number}
              onChange={e => setNewPlayer(p => ({ ...p, jersey_number: e.target.value }))}
              placeholder="#"
              type="number"
              className="w-16 bg-white/5 border border-white/20 rounded px-3 py-2 text-[#F5F0E8] placeholder-white/30 text-sm focus:outline-none focus:border-[#CE0E2D]"
            />
            <select
              value={newPlayer.position}
              onChange={e => setNewPlayer(p => ({ ...p, position: e.target.value }))}
              className="bg-white/5 border border-white/20 rounded px-3 py-2 text-[#F5F0E8] text-sm focus:outline-none focus:border-[#CE0E2D]"
            >
              {['GK', 'DEF', 'MID', 'FWD'].map(pos => <option key={pos} value={pos}>{pos}</option>)}
            </select>
            <button
              onClick={() => newPlayer.name && savePlayer({
                name: newPlayer.name,
                jersey_number: newPlayer.jersey_number ? parseInt(newPlayer.jersey_number) : null,
                position: newPlayer.position,
                is_active: true,
              })}
              disabled={!newPlayer.name || saving}
              className="bg-[#CE0E2D] text-white px-4 py-2 rounded text-sm font-bold uppercase tracking-wider disabled:opacity-50"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              Add
            </button>
          </div>
        </div>

        {/* Player list */}
        {loading ? (
          <div className="text-center py-8 text-white/40">Loading...</div>
        ) : (
          <div className="space-y-2">
            {players.map(player => (
              <div key={player.id} className={`flex items-center gap-3 p-3 rounded-lg border ${player.is_active ? 'border-white/10 bg-[#0D2D52]' : 'border-white/5 bg-white/3 opacity-50'}`}>
                <span className="w-8 text-center text-xs text-white/40 font-mono">{player.jersey_number ?? '—'}</span>
                <span className="flex-1 text-sm font-semibold text-[#F5F0E8] uppercase tracking-wide" style={{ fontFamily: "'Oswald', sans-serif" }}>{player.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${player.position === 'GK' ? 'bg-yellow-900/30 text-yellow-400' : player.position === 'DEF' ? 'bg-blue-900/30 text-blue-400' : player.position === 'MID' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                  {player.position}
                </span>
                <button
                  onClick={() => toggleActive(player)}
                  className={`text-xs uppercase tracking-wider px-3 py-1.5 rounded font-semibold ${player.is_active ? 'bg-[#CE0E2D]/20 text-[#CE0E2D] hover:bg-[#CE0E2D]/30' : 'bg-green-900/20 text-green-400 hover:bg-green-900/30'}`}
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  {player.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
