import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Always fetch-or-create: look up first, insert only if missing
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (existing) {
      return setAuthCookies(existing.id, existing.email)
    }

    const { data: created } = await supabaseAdmin
      .from('users')
      .insert({ email })
      .select('id, email')
      .single()

    if (!created) {
      // Race condition: another request inserted first — fetch it
      const { data: raceWinner } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single()
      if (!raceWinner) return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      return setAuthCookies(raceWinner.id, raceWinner.email)
    }

    return setAuthCookies(created.id, created.email)
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

function setAuthCookies(userId: string, email: string): NextResponse {
  const response = NextResponse.json({ ok: true, userId })
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  }
  response.cookies.set('rev11_user_id', userId, cookieOpts)
  response.cookies.set('rev11_user_email', email, cookieOpts)
  return response
}
