import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getDisplayName } from '@/lib/utils'

export async function GET() {
  const { data: users, error } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, total_points, games_played, perfect_scores')
    .order('total_points', { ascending: false })
    .order('perfect_scores', { ascending: false })
    .order('games_played', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
  }

  const entries = (users || []).map((user, index) => ({
    rank: index + 1,
    user_id: user.id,
    display_name: getDisplayName(user),
    total_points: user.total_points,
    games_played: user.games_played,
    perfect_scores: user.perfect_scores,
  }))

  return NextResponse.json({ entries })
}
