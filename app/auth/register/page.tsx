'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()
      if (res.ok) {
        setSent(true)
      } else {
        setError(data.error || 'Something went wrong. Try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#0A2240] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-6">📬</div>
          <h1 className="text-3xl font-black text-[#F5F0E8] uppercase tracking-widest mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Check Your Email
          </h1>
          <p className="text-white/60 mb-6">
            We sent a verification code to <span className="text-[#C5A55A] font-semibold">{email}</span>.
            Enter it below to join The Fort.
          </p>
          <Link
            href={`/auth/verify?email=${encodeURIComponent(email)}`}
            className="inline-block bg-[#CE0E2D] text-white px-8 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-[#A50B24] transition-all"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Enter My Code
          </Link>
          <p className="mt-4 text-white/30 text-sm">
            Didn&apos;t receive it?{' '}
            <button onClick={() => setSent(false)} className="text-[#C5A55A] hover:underline">
              Try again
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0A2240] stripe-overlay flex items-center justify-center px-4">
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-6xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>
              REV11
            </h1>
            <div className="h-0.5 bg-[#CE0E2D] mx-auto mt-2 mb-3" style={{ width: '50%' }} />
          </Link>
          <p className="text-[#C5A55A] text-xs tracking-[0.3em] uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Join The Fort
          </p>
        </div>

        {/* Form */}
        <div className="bg-[#0D2D52] rounded-xl border border-white/10 p-8">
          <h2 className="text-xl font-bold text-[#F5F0E8] uppercase tracking-wider mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
            Enter The Fort
          </h2>
          <p className="text-white/50 text-sm mb-6">
            Enter your email to receive a verification code. No password needed.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs uppercase tracking-widest text-[#C5A55A] mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="yourname@example.com"
                required
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-[#F5F0E8] placeholder-white/30 focus:outline-none focus:border-[#CE0E2D] focus:bg-white/8 transition-all text-base"
              />
            </div>

            {error && (
              <p className="text-[#CE0E2D] text-sm bg-[#CE0E2D]/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-[#CE0E2D] text-white py-3.5 rounded-lg font-black uppercase tracking-widest text-base hover:bg-[#A50B24] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Sending...
                </span>
              ) : (
                '⚔️ Bring the Fight'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <p className="text-white/30 text-xs">
              By joining, you&apos;re enlisting in The Fort.
              No spam, just match day alerts.
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-white/20 text-xs tracking-[0.3em] uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
            ★ Midnight Riders ★ Bring the Fight ★
          </p>
        </div>
      </div>
    </div>
  )
}
