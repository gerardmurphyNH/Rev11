import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdmin } from '@/lib/utils'

// POST /api/admin/adjust-points
// Body: { userId: string, points: number, reason?: string }
// Adds (or subtracts if negative) points to a user's total_points
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const userEmail = cookieStore.get('rev11_user_email')?.value
  if (!userEmail || !isAdmin(userEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId, points, reason } = await req.json()
  if (!userId || typeof points !== 'number' || isNaN(points)) {
    return NextResponse.json({ error: 'userId and numeric points are required' }, { status: 400 })
  }

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, total_points, games_played')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const newTotal = Math.max(0, user.total_points + points)

  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ total_points: newTotal })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update points' }, { status: 500 })
  }

  console.log(`[admin] ${userEmail} adjusted points for ${user.email}: ${user.total_points} → ${newTotal} (${points > 0 ? '+' : ''}${points}${reason ? `, reason: ${reason}` : ''})`)

  return NextResponse.json({
    ok: true,
    email: user.email,
    previousPoints: user.total_points,
    adjustment: points,
    newTotal,
    reason: reason || null,
  })
}

// GET /api/admin/adjust-points?email=xxx
// Look up a user by email to get their ID and current points
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const userEmail = cookieStore.get('rev11_user_email')?.value
  if (!userEmail || !isAdmin(userEmail)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  if (!email) {
    // Return all users for the dropdown
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('id, email, display_name, total_points, games_played')
      .order('total_points', { ascending: false })
    return NextResponse.json({ users: users || [] })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id, email, display_name, total_points, games_played')
    .eq('email', email)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user })
}
