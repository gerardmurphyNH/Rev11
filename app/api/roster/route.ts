import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: players, error } = await supabaseAdmin
    .from('players')
    .select('*')
    .eq('is_active', true)
    .order('position')
    .order('name')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 })
  }

  return NextResponse.json({ players: players || [] })
}
