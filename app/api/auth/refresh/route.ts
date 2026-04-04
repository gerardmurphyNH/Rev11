import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const email = req.cookies.get('rev11_user_email')?.value
  const redirectTo = req.nextUrl.searchParams.get('redirect') || '/'

  if (!email) {
    return NextResponse.redirect(new URL('/auth/register', req.url))
  }

  try {
    // Find or create user by email
    const { data: existing } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    const user = existing ?? (
      await supabaseAdmin.from('users').insert({ email }).select('id, email').single()
    ).data

    if (!user) {
      return NextResponse.redirect(new URL('/auth/register', req.url))
    }

    const response = NextResponse.redirect(new URL(redirectTo, req.url))
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    }
    response.cookies.set('rev11_user_id', user.id, cookieOpts)
    response.cookies.set('rev11_user_email', user.email, cookieOpts)
    return response
  } catch {
    return NextResponse.redirect(new URL('/auth/register', req.url))
  }
}
