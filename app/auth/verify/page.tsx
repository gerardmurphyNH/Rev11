'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get('email') || ''
  const codeParam = searchParams.get('code') || ''

  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState('')
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-verify if code param present
  useEffect(() => {
    if (emailParam && codeParam) {
      verifyCode(emailParam, codeParam)
    }
  }, [])

  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newDigits = [...digits]
    newDigits[index] = value.slice(-1)
    setDigits(newDigits)
    setError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    const fullCode = newDigits.join('')
    if (fullCode.length === 6) {
      verifyCode(email, fullCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newDigits = pasted.split('')
      setDigits(newDigits)
      verifyCode(email, pasted)
    }
  }

  const verifyCode = async (emailVal: string, codeVal: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, code: codeVal }),
        credentials: 'include',
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Invalid code. Please try again.')
        setDigits(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A2240] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/">
            <h1 className="text-5xl font-black text-[#F5F0E8] uppercase tracking-widest" style={{ fontFamily: "'Oswald', sans-serif" }}>
              REV11
            </h1>
            <div className="h-0.5 bg-[#CE0E2D] mx-auto mt-2 mb-3" style={{ width: '40%' }} />
          </Link>
        </div>

        <div className="bg-[#0D2D52] rounded-xl border border-white/10 p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔑</div>
            <h2 className="text-xl font-bold text-[#F5F0E8] uppercase tracking-wider" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Enter Your Code
            </h2>
            {email && (
              <p className="text-white/50 text-sm mt-2">
                Sent to <span className="text-[#C5A55A]">{email}</span>
              </p>
            )}
          </div>

          {!email && (
            <div className="mb-4">
              <label className="block text-xs uppercase tracking-widest text-[#C5A55A] mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-[#F5F0E8] placeholder-white/30 focus:outline-none focus:border-[#CE0E2D] transition-all"
                placeholder="yourname@example.com"
              />
            </div>
          )}

          {/* 6-digit code input */}
          <div className="flex gap-2 justify-center mb-4" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleDigitChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                disabled={loading}
                className={`w-12 h-14 text-center text-2xl font-bold rounded-lg border transition-all ${
                  digit
                    ? 'bg-[#CE0E2D]/20 border-[#CE0E2D] text-[#F5F0E8]'
                    : 'bg-white/5 border-white/20 text-[#F5F0E8]'
                } focus:outline-none focus:border-[#CE0E2D] disabled:opacity-50`}
                style={{ fontFamily: 'Courier New, monospace' }}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          {loading && (
            <div className="text-center mb-4">
              <span className="w-6 h-6 border-2 border-[#CE0E2D]/40 border-t-[#CE0E2D] rounded-full animate-spin inline-block" />
            </div>
          )}

          {error && (
            <p className="text-[#CE0E2D] text-sm bg-[#CE0E2D]/10 rounded-lg px-3 py-2 text-center mb-4">
              {error}
            </p>
          )}

          <div className="text-center">
            <Link href="/auth/register" className="text-[#C5A55A] text-sm hover:underline">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A2240] flex items-center justify-center">
        <span className="w-8 h-8 border-2 border-[#CE0E2D]/40 border-t-[#CE0E2D] rounded-full animate-spin" />
      </div>
    }>
      <VerifyForm />
    </Suspense>
  )
}
