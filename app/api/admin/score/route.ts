import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isAdmin } from '@/lib/utils'
import { supabaseAdmin } from '@/lib/supabase'
import { scoreMatchResult } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const email = cookieStore.get('rev11_user_email')?.value
  if (!email || !isAdmin(email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { matchId, revsScore, oppScore } = await req.json()
  if (!matchId) {
    return NextResponse.json({ error: 'matchId required' }, { status: 400 })
  }

  // Save the final score to the match
  if (typeof revsScore === 'number' && typeof oppScore === 'number') {
    await supabaseAdmin
      .from('matches')
      .update({ revs_score: revsScore, opp_score: oppScore })
      .eq('id', matchId)
  }

  // Run Phase 2: apply score prediction bonus points
  const { scored, errors } = await scoreMatchResult(matchId)
  return NextResponse.json({ ok: true, scored, errors })
}
