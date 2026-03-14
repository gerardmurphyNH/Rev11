'use client'

interface Player {
  id: string
  name: string
  jersey_number: number | null
  position: string | null
  headshot_url: string | null
}

interface PlayerCardProps {
  player: Player
  isSelected: boolean
  onToggle: (player: Player) => void
  disabled?: boolean
}

const positionColors: Record<string, string> = {
  GK: 'text-yellow-400',
  DEF: 'text-blue-400',
  MID: 'text-green-400',
  FWD: 'text-red-400',
}

export default function PlayerCard({ player, isSelected, onToggle, disabled = false }: PlayerCardProps) {
  const handleClick = () => {
    if (!disabled || isSelected) onToggle(player)
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled && !isSelected}
      aria-label={`${isSelected ? 'Remove' : 'Add'} ${player.name}`}
      aria-pressed={isSelected}
      className={`
        player-card-active w-full text-left rounded-lg p-3 transition-all duration-150 select-none
        min-h-[56px] flex items-center gap-3
        ${isSelected
          ? 'bg-[#CE0E2D]/20 border border-[#CE0E2D] animate-slam'
          : disabled
          ? 'bg-white/5 border border-white/5 opacity-50 cursor-not-allowed'
          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer'
        }
      `}
    >
      {/* Jersey number */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
          isSelected ? 'bg-[#CE0E2D] text-white' : 'bg-white/10 text-white/60'
        }`}
        style={{ fontFamily: 'Courier New, monospace' }}
      >
        {player.jersey_number ?? '—'}
      </div>

      {/* Name & position */}
      <div className="flex-1 min-w-0">
        <p
          className={`font-semibold uppercase tracking-wide truncate text-sm ${
            isSelected ? 'text-[#F5F0E8]' : 'text-white/80'
          }`}
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          {player.name}
        </p>
        {player.position && (
          <p className={`text-xs ${positionColors[player.position] || 'text-white/40'}`}>
            {player.position}
          </p>
        )}
      </div>

      {/* Check/add indicator */}
      <div className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
        isSelected
          ? 'bg-[#CE0E2D] border-[#CE0E2D]'
          : 'border-white/20'
      }`}>
        {isSelected ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M2 6l3 3 5-5" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" opacity="0.4">
            <path d="M6 2v8M2 6h8" />
          </svg>
        )}
      </div>
    </button>
  )
}
