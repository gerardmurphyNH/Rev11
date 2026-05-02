import { supabaseAdmin } from './supabase'
import { calcPoints, calcScorePoints } from './utils'

// ─── Phase 1: Score player lineup picks ────────────────────────────────────
// Called when admin confirms the correct starting XI (before/after kickoff).
// Calculates lineup points only — score prediction points come in Phase 2.
export async function scoreLineup(matchId: string): Promise<{ scored: number; errors: string[] }> {
  const errors: string[] = []

  // Require a confirmed correct lineup
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

  const correctPlayerIds = new Set((correctPlayers || []).map((p: any) => p.player_id))

  // Only score predictions that haven't been locked yet (lineup points not yet applied)
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('id, user_id')
    .eq('match_id', matchId)
    .eq('is_locked', false)

  if (!predictions?.length) {
    return { scored: 0, errors: ['No predictions to score (all already locked)'] }
  }

  let scored = 0

  for (const prediction of predictions as any[]) {
    try {
      const { data: picks } = await supabaseAdmin
        .from('prediction_players')
        .select('player_id')
        .eq('prediction_id', prediction.id)

      const pickedIds = ((picks || []) as any[]).map((p: any) => p.player_id)
      const correctCount = pickedIds.filter((id: string) => correctPlayerIds.has(id)).length
      const isPerfect = correctCount === 11
      const lineupPoints = calcPoints(correctCount)

      // Save lineup points; score_points_earned stays NULL until Phase 2
      await supabaseAdmin
        .from('predictions')
        .update({
          points_earned: lineupPoints,
          is_perfect: isPerfect,
          is_locked: true,
          // score_points_earned intentionally left NULL — applied in scoreMatchResult
        })
        .eq('id', prediction.id)

      // Update user totals with lineup points only
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('total_points, games_played, perfect_scores')
        .eq('id', prediction.user_id)
        .single()

      if (user) {
        await supabaseAdmin
          .from('users')
          .update({
            total_points: (user as any).total_points + lineupPoints,
            games_played: (user as any).games_played + 1,
            perfect_scores: (user as any).perfect_scores + (isPerfect ? 1 : 0),
          })
          .eq('id', prediction.user_id)
      }

      scored++
    } catch (e) {
      errors.push(`Failed to score prediction ${prediction.id}: ${e}`)
    }
  }

  // Mark match as completed so users can see their lineup results
  await supabaseAdmin
    .from('matches')
    .update({ status: 'completed' })
    .eq('id', matchId)

  return { scored, errors }
}

// ─── Phase 2: Score match result predictions ───────────────────────────────
// Called when admin enters the actual final score after the match.
// Adds score prediction bonus points on top of already-locked lineup points.
// Safe to re-run — skips any prediction that already has score_points_earned set.
export async function scoreMatchResult(matchId: string): Promise<{ scored: number; errors: string[] }> {
  const errors: string[] = []

  // Get actual final score
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('revs_score, opp_score')
    .eq('id', matchId)
    .single()

  if (!match || (match as any).revs_score == null || (match as any).opp_score == null) {
    return { scored: 0, errors: ['No final score set for this match'] }
  }

  const actualRevs = (match as any).revs_score as number
  const actualOpp = (match as any).opp_score as number

  // Score all locked predictions that haven't had score points applied yet
  // (score_points_earned IS NULL means Phase 2 hasn't run for this prediction)
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('id, user_id, predicted_revs_score, predicted_opp_score, points_earned')
    .eq('match_id', matchId)
    .eq('is_locked', true)
    .is('score_points_earned', null)

  if (!predictions?.length) {
    return { scored: 0, errors: ['No predictions need score scoring (already applied or none exist)'] }
  }

  let scored = 0

  for (const prediction of predictions as any[]) {
    try {
      const scorePoints = calcScorePoints(
        prediction.predicted_revs_score,
        prediction.predicted_opp_score,
        actualRevs,
        actualOpp
      )

      // Add score points on top of existing lineup points
      const newTotal = (prediction.points_earned ?? 0) + scorePoints

      await supabaseAdmin
        .from('predictions')
        .update({
          score_points_earned: scorePoints,   // 0 = scored but got nothing; NULL = not yet scored
          points_earned: newTotal,
        })
        .eq('id', prediction.id)

      // Update user's total points with score bonus
      if (scorePoints > 0) {
        const { data: user } = await supabaseAdmin
          .from('users')
          .select('total_points')
          .eq('id', prediction.user_id)
          .single()

        if (user) {
          await supabaseAdmin
            .from('users')
            .update({ total_points: (user as any).total_points + scorePoints })
            .eq('id', prediction.user_id)
        }
      }

      scored++
    } catch (e) {
      errors.push(`Failed to score prediction ${prediction.id}: ${e}`)
    }
  }

  return { scored, errors }
}

// ─── Legacy alias (used by confirm-lineup email route) ─────────────────────
export const scoreMatch = scoreLineup
