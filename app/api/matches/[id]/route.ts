import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const { data: match, error } = await supabaseAdmin
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  // Get correct lineup if exists
  const { data: correctLineup } = await supabaseAdmin
    .from('correct_lineups')
    .select('*')
    .eq('match_id', id)
    .maybeSingle()

  let correctLineupPlayerIds: string[] = []
  if (correctLineup) {
    const { data: clPlayers } = await supabaseAdmin
      .from('correct_lineup_players')
      .select('player_id')
      .eq('correct_lineup_id', correctLineup.id)
    correctLineupPlayerIds = (clPlayers || []).map(p => p.player_id)
  }

  return NextResponse.json({ match, correctLineup, correctLineupPlayerIds })
}
