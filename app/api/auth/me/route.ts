import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isAdmin } from '@/lib/utils'

export async function GET(_req: NextRequest) {
  const cookieStore = await cookies()
  const email = cookieStore.get('rev11_user_email')?.value
  const userId = cookieStore.get('rev11_user_id')?.value

  return NextResponse.json({
    isAdmin: email ? isAdmin(email) : false,
    userId: userId || null,
    email: email || null,
  })
}
