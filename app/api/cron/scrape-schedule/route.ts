import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { scrapeSchedule } from '@/lib/scraper'
import { getLockTime } from '@/lib/utils'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  const referer = req.headers.get('Referer') || ''
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && !referer.includes('/admin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const matches = await scrapeSchedule()

  if (matches.length === 0) {
    return NextResponse.json({ ok: false, message: 'No matches scraped', upserted: 0 })
  }

  let upserted = 0
  for (const match of matches) {
    const lockTime = getLockTime(match.match_date)
    const { error } = await supabaseAdmin
      .from('matches')
      .upsert(
        {
          opponent: match.opponent,
          match_date: match.match_date,
          is_home: match.is_home,
          venue: match.venue,
          competition: match.competition,
          match_url: match.match_url,
          status: 'upcoming',
          locked_at: lockTime.toISOString(),
        },
        { onConflict: 'opponent,match_date' }
      )
    if (!error) upserted++
  }

  return NextResponse.json({ ok: true, scraped: matches.length, upserted })
}
