'use client'

import { useEffect, useState } from 'react'

interface MusketBlastProps {
  onComplete?: () => void
}

export default function MusketBlast({ onComplete }: MusketBlastProps) {
  const [phase, setPhase] = useState<'flash' | 'smoke' | 'done'>('flash')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('smoke'), 400)
    const t2 = setTimeout(() => {
      setPhase('done')
      onComplete?.()
    }, 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onComplete])

  if (phase === 'done') return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Flash */}
      {phase === 'flash' && (
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle, rgba(255,200,0,0.4) 0%, transparent 70%)',
            animation: 'fadeOut 0.4s ease-out forwards',
          }}
        />
      )}

      {/* Center celebration */}
      <div className="relative flex flex-col items-center gap-4">
        {/* Stars burst */}
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="absolute text-2xl"
            style={{
              transform: `rotate(${i * 60}deg) translateY(-60px)`,
              animation: `musketBlast 0.6s ease-out ${i * 0.05}s forwards`,
            }}
          >
            ★
          </div>
        ))}

        {/* Main badge */}
        <div
          className="bg-[#C5A55A] text-[#0A2240] rounded-lg px-8 py-6 text-center animate-musket shadow-2xl"
        >
          <div
            className="text-4xl font-black uppercase tracking-widest"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            PERFECT!
          </div>
          <div className="text-5xl my-2">🎯</div>
          <div
            className="text-lg font-bold uppercase tracking-widest"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            End Zone Militia<br />Fires For You!
          </div>
          <div className="text-sm mt-2 opacity-80">11/11 — Muskets Blazing!</div>
        </div>

        {/* Smoke particles */}
        {phase === 'smoke' && Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-white/30"
            style={{
              transform: `rotate(${i * 45}deg) translateY(-${40 + i * 10}px)`,
              animation: 'musketBlast 0.8s ease-out forwards',
            }}
          />
        ))}
      </div>
    </div>
  )
}
