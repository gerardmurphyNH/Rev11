import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: players, error } = await supabaseAdmin
    .from('players')
    .select('*')
    .eq('is_active', true)
    .order('position')

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch roster' }, { status: 500 })
  }

  const posOrder: Record<string, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 }
  const lastName = (name: string) => name.trim().split(' ').pop()?.toLowerCase() ?? name.toLowerCase()
  const sorted = (players || []).sort((a, b) => {
    const posDiff = (posOrder[a.position ?? ''] ?? 4) - (posOrder[b.position ?? ''] ?? 4)
    if (posDiff !== 0) return posDiff
    return lastName(a.name).localeCompare(lastName(b.name))
  })

  return NextResponse.json({ players: sorted })
}
