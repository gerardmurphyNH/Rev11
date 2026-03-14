import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendMatchReminderEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Find matches ~12 hours from now (within a 1-hour window)
  const now = new Date()
  const twelveHoursOut = new Date(now.getTime() + 12 * 60 * 60 * 1000)
  const elevenHoursOut = new Date(now.getTime() + 11 * 60 * 60 * 1000)

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('id, opponent, match_date')
    .eq('status', 'upcoming')
    .gte('match_date', elevenHoursOut.toISOString())
    .lte('match_date', twelveHoursOut.toISOString())

  if (!matches?.length) {
    return NextResponse.json({ ok: true, sent: 0 })
  }

  // Get all users
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('email')

  let sent = 0
  for (const match of matches) {
    for (const user of users || []) {
      try {
        await sendMatchReminderEmail(user.email, match)
        sent++
      } catch (e) {
        console.error('Failed to send reminder to', user.email, e)
      }
    }
  }

  return NextResponse.json({ ok: true, sent, matches: matches.length, users: users?.length || 0 })
}
