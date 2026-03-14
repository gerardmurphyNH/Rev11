import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin, getLockTime } from '@/lib/utils'

async function checkAdmin() {
  const cookieStore = await cookies()
  const email = cookieStore.get('rev11_user_email')?.value
  return email && isAdmin(email)
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  if (body.id) {
    // Update existing match
    const updates: Record<string, unknown> = {}
    if (body.opponent !== undefined) updates.opponent = body.opponent
    if (body.match_date !== undefined) {
      updates.match_date = new Date(body.match_date).toISOString()
      updates.locked_at = getLockTime(updates.match_date as string).toISOString()
    }
    if (body.is_home !== undefined) updates.is_home = body.is_home
    if (body.venue !== undefined) updates.venue = body.venue
    if (body.competition !== undefined) updates.competition = body.competition
    if (body.status !== undefined) updates.status = body.status
    if (body.match_url !== undefined) updates.match_url = body.match_url

    const { data, error } = await supabaseAdmin
      .from('matches')
      .update(updates)
      .eq('id', body.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ match: data })
  } else {
    // Insert new match
    const matchDate = new Date(body.match_date).toISOString()
    const { data, error } = await supabaseAdmin
      .from('matches')
      .insert({
        opponent: body.opponent,
        match_date: matchDate,
        is_home: body.is_home ?? true,
        venue: body.venue || (body.is_home ? 'Gillette Stadium' : null),
        competition: body.competition || 'MLS',
        match_url: body.match_url || null,
        status: 'upcoming',
        locked_at: getLockTime(matchDate).toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ match: data })
  }
}
