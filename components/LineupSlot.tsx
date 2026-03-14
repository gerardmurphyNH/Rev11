'use client'

interface Player {
  id: string
  name: string
  jersey_number: number | null
  position: string | null
}

interface LineupSlotProps {
  slot: number
  player: Player | null
  onRemove?: (playerId: string) => void
}

export default function LineupSlot({ slot, player, onRemove }: LineupSlotProps) {
  if (!player) {
    return (
      <div className="flex items-center gap-3 p-2.5 rounded-lg border border-dashed border-white/15 bg-white/3">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white/30 bg-white/5 flex-shrink-0"
          style={{ fontFamily: 'Courier New, monospace' }}
        >
          {slot}
        </div>
        <span className="text-white/25 text-sm italic" style={{ fontFamily: "'Source Sans 3', sans-serif" }}>
          Empty slot
        </span>
      </div>
    )
  }

  return (
    <div className="animate-slam flex items-center gap-3 p-2.5 rounded-lg border border-[#C5A55A]/30 bg-[#C5A55A]/5">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-[#0A2240] bg-[#C5A55A] flex-shrink-0"
        style={{ fontFamily: 'Courier New, monospace' }}
      >
        {slot}
      </div>
      <span
        className="flex-1 font-semibold uppercase tracking-wide text-sm text-[#F5F0E8] truncate"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        {player.name}
      </span>
      {player.position && (
        <span className="text-xs text-white/40 flex-shrink-0">{player.position}</span>
      )}
      {onRemove && (
        <button
          onClick={() => onRemove(player.id)}
          className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 hover:bg-[#CE0E2D]/40 flex items-center justify-center transition-colors"
          aria-label={`Remove ${player.name}`}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 2l6 6M8 2l-6 6" />
          </svg>
        </button>
      )}
    </div>
  )
}
