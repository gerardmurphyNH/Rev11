import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/utils'
import { scoreMatch } from '@/lib/scoring'
import { sendResultsEmail } from '@/lib/email'
import { getDisplayName } from '@/lib/utils'

async function checkAdmin() {
  const cookieStore = await cookies()
  const email = cookieStore.get('rev11_user_email')?.value
  return email ? (isAdmin(email) ? email : null) : null
}

export async function POST(req: NextRequest) {
  const adminEmail = await checkAdmin()
  if (!adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { matchId, playerIds, confirm, revsScore, oppScore } = await req.json()

  if (!matchId || !Array.isArray(playerIds) || playerIds.length !== 11) {
    return NextResponse.json({ error: 'matchId and exactly 11 playerIds required' }, { status: 400 })
  }

  // Store actual final score on the match if provided
  if (typeof revsScore === 'number' && typeof oppScore === 'number') {
    await supabaseAdmin
      .from('matches')
      .update({ revs_score: revsScore, opp_score: oppScore })
      .eq('id', matchId)
  }

  // Upsert correct_lineup
  const { data: existing } = await supabaseAdmin
    .from('correct_lineups')
    .select('id')
    .eq('match_id', matchId)
    .maybeSingle()

  let lineupId: string

  if (existing) {
    lineupId = existing.id
    await supabaseAdmin
      .from('correct_lineups')
      .update({
        status: confirm ? 'confirmed' : 'pending',
        confirmed_by: confirm ? adminEmail : null,
        confirmed_at: confirm ? new Date().toISOString() : null,
      })
      .eq('id', lineupId)

    await supabaseAdmin.from('correct_lineup_players').delete().eq('correct_lineup_id', lineupId)
  } else {
    const { data: newLineup } = await supabaseAdmin
      .from('correct_lineups')
      .insert({
        match_id: matchId,
        status: confirm ? 'confirmed' : 'pending',
        confirmed_by: confirm ? adminEmail : null,
        confirmed_at: confirm ? new Date().toISOString() : null,
      })
      .select('id')
      .single()
    lineupId = newLineup!.id
  }

  // Insert players
  await supabaseAdmin.from('correct_lineup_players').insert(
    playerIds.map((player_id: string) => ({ correct_lineup_id: lineupId, player_id }))
  )

  const { data: lineup } = await supabaseAdmin
    .from('correct_lineups')
    .select('*')
    .eq('id', lineupId)
    .single()

  // Trigger scoring if confirmed
  if (confirm) {
    const { scored, errors } = await scoreMatch(matchId)

    // Send result emails
    if (scored > 0) {
      await sendResultEmails(matchId, playerIds)
    }

    return NextResponse.json({ lineup, scored, errors })
  }

  return NextResponse.json({ lineup })
}

async function sendResultEmails(matchId: string, correctPlayerIds: string[]) {
  const correctSet = new Set(correctPlayerIds)

  // Get match info
  const { data: match } = await supabaseAdmin.from('matches').select('*').eq('id', matchId).single()
  if (!match) return

  // Get correct player names
  const { data: correctPlayers } = await supabaseAdmin
    .from('players')
    .select('id, name')
    .in('id', correctPlayerIds)

  // Get all scored predictions for this match
  const { data: predictions } = await supabaseAdmin
    .from('predictions')
    .select('id, user_id, points_earned, is_perfect')
    .eq('match_id', matchId)
    .not('points_earned', 'is', null)

  if (!predictions?.length) return

  // Get leaderboard for ranks
  const { data: allUsers } = await supabaseAdmin
    .from('users')
    .select('id, total_points')
    .order('total_points', { ascending: false })

  for (const pred of predictions) {
    const { data: user } = await supabaseAdmin.from('users').select('email, display_name').eq('id', pred.user_id).single()
    if (!user) continue

    const { data: picks } = await supabaseAdmin
      .from('prediction_players')
      .select('player_id')
      .eq('prediction_id', pred.id)

    const pickedIds = new Set((picks || []).map(p => p.player_id))
    const { data: pickedPlayers } = await supabaseAdmin
      .from('players')
      .select('id, name')
      .in('id', Array.from(pickedIds))

    const correctPicked = (pickedPlayers || []).filter(p => correctSet.has(p.id)).map(p => p.name)
    const missedPicked = (pickedPlayers || []).filter(p => !correctSet.has(p.id)).map(p => p.name)

    const rank = (allUsers || []).findIndex(u => u.id === pred.user_id) + 1

    try {
      await sendResultsEmail(user.email, {
        match,
        correctCount: correctPicked.length,
        points: pred.points_earned || 0,
        isPerfect: pred.is_perfect,
        correctPlayerNames: correctPicked,
        missedPlayerNames: missedPicked,
        leaderboardRank: rank,
        totalUsers: allUsers?.length || 0,
      })
    } catch (e) {
      console.error('Failed to send result email to', user.email, e)
    }
  }
}
