import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params
  const cookieStore = await cookies()
  const userId = cookieStore.get('rev11_user_id')?.value
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: prediction } = await supabaseAdmin
    .from('predictions')
    .select('id, points_earned, is_perfect, is_locked')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle()

  if (!prediction) {
    return NextResponse.json({ prediction: null, playerIds: [] })
  }

  const { data: picks } = await supabaseAdmin
    .from('prediction_players')
    .select('player_id')
    .eq('prediction_id', prediction.id)

  return NextResponse.json({
    prediction,
    playerIds: (picks || []).map(p => p.player_id),
  })
}
