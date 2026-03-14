import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/utils'

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
    // Update existing player
    const { data, error } = await supabaseAdmin
      .from('players')
      .update({
        ...(body.name !== undefined && { name: body.name }),
        ...(body.jersey_number !== undefined && { jersey_number: body.jersey_number }),
        ...(body.position !== undefined && { position: body.position }),
        ...(body.is_active !== undefined && { is_active: body.is_active }),
        last_updated: new Date().toISOString(),
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ player: data })
  } else {
    // Insert new player
    const { data, error } = await supabaseAdmin
      .from('players')
      .insert({
        name: body.name,
        jersey_number: body.jersey_number || null,
        position: body.position || null,
        is_active: body.is_active ?? true,
        headshot_url: body.headshot_url || null,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ player: data })
  }
}
