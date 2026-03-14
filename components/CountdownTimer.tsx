'use client'

import { useState, useEffect } from 'react'
import { getCountdownParts } from '@/lib/utils'

interface CountdownTimerProps {
  matchDate: string
  onLock?: () => void
  className?: string
}

export default function CountdownTimer({ matchDate, onLock, className = '' }: CountdownTimerProps) {
  const [parts, setParts] = useState(() => getCountdownParts(matchDate))

  useEffect(() => {
    const interval = setInterval(() => {
      const next = getCountdownParts(matchDate)
      setParts(next)
      if (next.isLocked && onLock) {
        onLock()
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [matchDate, onLock])

  if (parts.isLocked) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="animate-lock-pulse">🔒</span>
        <span
          className="text-[#CE0E2D] font-bold uppercase tracking-widest text-sm"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Locked
        </span>
      </div>
    )
  }

  const blocks = parts.days > 0
    ? [
        { val: parts.days, label: 'D' },
        { val: parts.hours, label: 'H' },
        { val: parts.minutes, label: 'M' },
      ]
    : [
        { val: parts.hours, label: 'H' },
        { val: parts.minutes, label: 'M' },
        { val: parts.seconds, label: 'S' },
      ]

  const isUrgent = parts.totalSeconds < 3600 // under 1 hour

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="text-white/50 text-xs mr-1 uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
        Lock
      </span>
      {blocks.map(({ val, label }, i) => (
        <span key={label} className="flex items-center gap-1">
          {i > 0 && <span className={`${isUrgent ? 'text-[#CE0E2D]' : 'text-white/40'} text-xs`}>:</span>}
          <span
            className={`font-bold text-sm tabular-nums ${isUrgent ? 'text-[#CE0E2D]' : 'text-[#C5A55A]'}`}
            style={{ fontFamily: 'Courier New, monospace' }}
          >
            {String(val).padStart(2, '0')}
            <span className="text-[10px] ml-0.5 opacity-70">{label}</span>
          </span>
        </span>
      ))}
    </div>
  )
}
