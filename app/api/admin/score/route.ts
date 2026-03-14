import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isAdmin } from '@/lib/utils'
import { scoreMatch } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const email = cookieStore.get('rev11_user_email')?.value
  if (!email || !isAdmin(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { matchId } = await req.json()
  if (!matchId) {
    return NextResponse.json({ error: 'matchId required' }, { status: 400 })
  }

  const { scored, errors } = await scoreMatch(matchId)
  return NextResponse.json({ ok: true, scored, errors })
}
