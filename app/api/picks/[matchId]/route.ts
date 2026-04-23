import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getDisplayName } from '@/lib/utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params

  // Only return picks for completed matches
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('status, revs_score, opp_score')
    .eq('id', matchId)
    .single()

  if (!match || match.status !== 'completed') {
    return NextResponse.json({ picks: [] })
  }

  // Fetch all predictions for this match with user info
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('id, user_id, points_earned, score_points_earned, predicted_revs_score, predicted_opp_score, is_perfect')
    .eq('match_id', matchId)

  if (!predictions?.length) return NextResponse.json({ picks: [] })

  // Fetch all users in one query
  const userIds = [...new Set(predictions.map(p => p.user_id))]
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name')
    .in('id', userIds)

  const userMap = new Map((users || []).map(u => [u.id, u]))

  // Fetch all prediction_players for these predictions in one query
  const predictionIds = predictions.map(p => p.id)
  const { data: allPicks } = await supabaseAdmin
    .from('prediction_players')
    .select('prediction_id, player_id')
    .in('prediction_id', predictionIds)

  // Fetch all referenced players
  const playerIds = [...new Set((allPicks || []).map(p => p.player_id))]
  const { data: players } = await supabaseAdmin
    .from('players')
    .select('id, name, position')
    .in('id', playerIds)

  const playerMap = new Map((players || []).map(p => [p.id, p]))

  // Group picks by prediction
  const picksByPrediction = new Map<string, { id: string; name: string; position: string | null }[]>()
  for (const pick of allPicks || []) {
    const player = playerMap.get(pick.player_id)
    if (!player) continue
    const arr = picksByPrediction.get(pick.prediction_id) || []
    arr.push({ id: pick.player_id, name: player.name, position: player.position })
    picksByPrediction.set(pick.prediction_id, arr)
  }

  // Build response
  const result = predictions
    .map(pred => {
      const user = userMap.get(pred.user_id)
      if (!user) return null
      return {
        user_id: pred.user_id,
        display_name: getDisplayName(user),
        points_earned: pred.points_earned,
        score_points_earned: pred.score_points_earned,
        predicted_revs_score: pred.predicted_revs_score,
        predicted_opp_score: pred.predicted_opp_score,
        is_perfect: pred.is_perfect,
        players: (picksByPrediction.get(pred.id) || []).sort((a, b) => {
          const order: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 }
          return (order[a.position ?? ''] ?? 4) - (order[b.position ?? ''] ?? 4)
        }),
      }
    })
    .filter(Boolean)
    .sort((a, b) => (b!.points_earned ?? -1) - (a!.points_earned ?? -1))

  return NextResponse.json({
    picks: result,
    revs_score: match.revs_score,
    opp_score: match.opp_score,
  })
}
