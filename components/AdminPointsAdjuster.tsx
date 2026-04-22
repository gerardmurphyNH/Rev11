'use client'

import { useState } from 'react'

interface User {
  id: string
  email: string
  display_name: string | null
  total_points: number
  games_played: number
}

interface AdminPointsAdjusterProps {
  users: User[]
}

export default function AdminPointsAdjuster({ users }: AdminPointsAdjusterProps) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [points, setPoints] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)

  const selectedUser = users.find((u) => u.id === selectedUserId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !points) return

    const pointsNum = parseInt(points, 10)
    if (isNaN(pointsNum)) return

    setLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/adjust-points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUserId, points: pointsNum, reason }),
      })
      const data = await res.json()

      if (data.ok) {
        setResult({
          ok: true,
          message: `✓ ${data.email}: ${data.previousPoints} → ${data.newTotal} pts (${pointsNum > 0 ? '+' : ''}${pointsNum})`,
        })
        setPoints('')
        setReason('')
      } else {
        setResult({ ok: false, message: data.error || 'Something went wrong' })
      }
    } catch {
      setResult({ ok: false, message: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#0D2D52] border border-white/10 rounded-lg p-5">
      <h2
        className="text-sm font-bold uppercase tracking-widest text-[#C5A55A] mb-4"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        ⚡ Manual Point Adjustment
      </h2>
      <p className="text-white/40 text-xs mb-4">
        Use this to correct scoring errors or award points for lineup saves that didn't register.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* User selector */}
        <div>
          <label
            className="block text-xs uppercase tracking-wider text-white/40 mb-1"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            User
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            required
            className="w-full bg-[#0A2240] border border-white/20 rounded px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-[#C5A55A]"
          >
            <option value="">— Select a user —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email} ({u.total_points} pts, {u.games_played} games)
              </option>
            ))}
          </select>
        </div>

        {selectedUser && (
          <div className="bg-[#0A2240] rounded px-3 py-2 text-xs text-white/50">
            Current total: <span className="text-[#C5A55A] font-bold">{selectedUser.total_points} pts</span> across{' '}
            {selectedUser.games_played} game{selectedUser.games_played !== 1 ? 's' : ''}
          </div>
        )}

        {/* Points */}
        <div>
          <label
            className="block text-xs uppercase tracking-wider text-white/40 mb-1"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Points to Add (use negative to subtract)
          </label>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            placeholder="e.g. 10 or -5"
            required
            className="w-full bg-[#0A2240] border border-white/20 rounded px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-[#C5A55A] placeholder-white/20"
          />
          {points && selectedUser && !isNaN(parseInt(points)) && (
            <p className="text-xs text-white/30 mt-1">
              New total:{' '}
              <span className="text-[#C5A55A] font-bold">
                {Math.max(0, selectedUser.total_points + parseInt(points))} pts
              </span>
            </p>
          )}
        </div>

        {/* Reason */}
        <div>
          <label
            className="block text-xs uppercase tracking-wider text-white/40 mb-1"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Reason (optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Lineup save didn't register for vs. Atlanta"
            className="w-full bg-[#0A2240] border border-white/20 rounded px-3 py-2 text-white/80 text-sm focus:outline-none focus:border-[#C5A55A] placeholder-white/20"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedUserId || !points}
          className="w-full bg-[#CE0E2D]/80 hover:bg-[#CE0E2D] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase tracking-wider text-sm py-2.5 rounded transition-colors"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {loading ? 'Adjusting…' : 'Apply Adjustment'}
        </button>

        {result && (
          <div
            className={`text-sm px-3 py-2 rounded ${
              result.ok
                ? 'bg-green-900/20 border border-green-500/30 text-green-400'
                : 'bg-red-900/20 border border-red-500/30 text-red-400'
            }`}
          >
            {result.message}
          </div>
        )}
      </form>
    </div>
  )
}
