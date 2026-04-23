import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { isMatchLocked } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const userId = cookieStore.get('rev11_user_id')?.value
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { matchId, playerIds, predictedRevsScore, predictedOppScore } = await req.json()
  if (!matchId || !Array.isArray(playerIds) || playerIds.length > 11) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Validate score predictions (0–20 or null)
  const revsScore = (typeof predictedRevsScore === 'number' && predictedRevsScore >= 0 && predictedRevsScore <= 20)
    ? Math.round(predictedRevsScore) : null
  const oppScore = (typeof predictedOppScore === 'number' && predictedOppScore >= 0 && predictedOppScore <= 20)
    ? Math.round(predictedOppScore) : null

  // Get match & enforce lock server-side
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('match_date, status')
    .eq('id', matchId)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  if (isMatchLocked(match.match_date) || match.status === 'locked' || match.status === 'completed') {
    return NextResponse.json({ error: 'Match is locked' }, { status: 403 })
  }

  // Upsert prediction
  const { data: existing } = await supabaseAdmin
    .from('predictions')
    .select('id')
    .eq('user_id', userId)
    .eq('match_id', matchId)
    .maybeSingle()

  let predictionId: string

  if (existing) {
    predictionId = existing.id
    await supabaseAdmin
      .from('predictions')
      .update({
        updated_at: new Date().toISOString(),
        ...(revsScore !== null && { predicted_revs_score: revsScore }),
        ...(oppScore !== null && { predicted_opp_score: oppScore }),
      })
      .eq('id', predictionId)

    // Delete old picks
    await supabaseAdmin
      .from('prediction_players')
      .delete()
      .eq('prediction_id', predictionId)
  } else {
    const { data: newPred } = await supabaseAdmin
      .from('predictions')
      .insert({
        user_id: userId,
        match_id: matchId,
        ...(revsScore !== null && { predicted_revs_score: revsScore }),
        ...(oppScore !== null && { predicted_opp_score: oppScore }),
      })
      .select('id')
      .single()
    predictionId = newPred!.id
  }

  // Insert new picks
  if (playerIds.length > 0) {
    await supabaseAdmin.from('prediction_players').insert(
      playerIds.map((player_id: string) => ({ prediction_id: predictionId, player_id }))
    )
  }

  return NextResponse.json({ ok: true, predictionId })
}
