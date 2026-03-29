import { NextResponse } from 'next/server'

// Verification codes removed — auth is now email-only, no code needed.
export async function POST() {
  return NextResponse.redirect('/auth/register', { status: 308 })
}
