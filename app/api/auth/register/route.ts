import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendVerificationEmail } from '@/lib/email'
import { generateAuthCode } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const code = generateAuthCode()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    // Upsert user
    await supabaseAdmin
      .from('users')
      .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })

    // Delete old codes for this email
    await supabaseAdmin.from('auth_codes').delete().eq('email', email)

    // Insert new code
    await supabaseAdmin.from('auth_codes').insert({
      email,
      code,
      expires_at: expiresAt,
    })

    await sendVerificationEmail(email, code)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}
