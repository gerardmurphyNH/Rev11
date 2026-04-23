import { supabaseAdmin } from './supabase'
import { calcPoints, calcScorePoints } from './utils'

export async function scoreMatch(matchId: string): Promise<{ scored: number; errors: string[] }> {
  const errors: string[] = []

  // Get confirmed correct lineup
  const { data: correctLineup, error: clError } = await supabaseAdmin
    .from('correct_lineups')
    .select('id, status')
    .eq('match_id', matchId)
    .eq('status', 'confirmed')
    .single()

  if (clError || !correctLineup) {
    return { scored: 0, errors: ['No confirmed lineup for this match'] }
  }

  // Get correct player IDs
  const { data: correctPlayers } = await supabaseAdmin
    .from('correct_lineup_players')
    .select('player_id')
    .eq('correct_lineup_id', correctLineup.id)

  const correctPlayerIds = new Set((correctPlayers || []).map(p => p.player_id))

  // Get match actual score (for score prediction scoring)
  const { data: matchData } = await supabaseAdmin
    .from('matches')
    .select('revs_score, opp_score')
    .eq('id', matchId)
    .single()

  // Get all predictions for this match
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('id, user_id, predicted_revs_score, predicted_opp_score')
    .eq('match_id', matchId)
    .eq('is_locked', false)

  if (!predictions?.length) {
    return { scored: 0, errors: ['No predictions to score'] }
  }

  let scored = 0

  for (const prediction of predictions) {
    try {
      // Get this user's picks
      const { data: picks } = await supabaseAdmin
        .from('prediction_players')
        .select('player_id')
        .eq('prediction_id', prediction.id)

      const pickedIds = (picks || []).map(p => p.player_id)
      const correctCount = pickedIds.filter(id => correctPlayerIds.has(id)).length
      const isPerfect = correctCount === 11
      const lineupPoints = calcPoints(correctCount)

      // Score prediction bonus
      const scorePoints = (matchData?.revs_score != null && matchData?.opp_score != null)
        ? calcScorePoints(
            prediction.predicted_revs_score,
            prediction.predicted_opp_score,
            matchData.revs_score,
            matchData.opp_score
          )
        : 0
      const points = lineupPoints + scorePoints

      // Update prediction
      await supabaseAdmin
        .from('predictions')
        .update({
          points_earned: points,
          score_points_earned: scorePoints,
          is_perfect: isPerfect,
          is_locked: true,
        })
        .eq('id', prediction.id)

      // Update user totals
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('total_points, games_played, perfect_scores')
        .eq('id', prediction.user_id)
        .single()

      if (user) {
        await supabaseAdmin
          .from('users')
          .update({
            total_points: user.total_points + points,
            games_played: user.games_played + 1,
            perfect_scores: user.perfect_scores + (isPerfect ? 1 : 0),
          })
          .eq('id', prediction.user_id)
      }

      scored++
    } catch (e) {
      errors.push(`Failed to score prediction ${prediction.id}: ${e}`)
    }
  }

  // Update match status
  await supabaseAdmin
    .from('matches')
    .update({ status: 'completed' })
    .eq('id', matchId)

  return { scored, errors }
}
