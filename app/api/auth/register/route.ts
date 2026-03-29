import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Upsert user
    const { data: user } = await supabaseAdmin
      .from('users')
      .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })
      .select('id, email')
      .single()

    if (!user) {
      // upsert with ignoreDuplicates won't return on conflict — fetch separately
      const { data: existing } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single()

      if (!existing) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
      }

      return setAuthCookies(existing.id, existing.email)
    }

    return setAuthCookies(user.id, user.email)
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
