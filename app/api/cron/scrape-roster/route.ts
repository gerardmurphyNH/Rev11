import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { scrapeRoster } from '@/lib/scraper'
import { sendAdminManualLineupRequest } from '@/lib/email'

function verifyCron(req: NextRequest): boolean {
  const authHeader = req.headers.get('Authorization')
  if (authHeader === `Bearer ${process.env.CRON_SECRET}`) return true
  // Also allow POST from admin UI (checked separately via cookie)
  return false
}

export async function POST(req: NextRequest) {
  if (!verifyCron(req)) {
    // Allow admin trigger via form (basic check)
    const referer = req.headers.get('Referer') || ''
    if (!referer.includes('/admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const players = await scrapeRoster()

  if (players.length === 0) {
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',')
    // Don't send lineup email here, just log
    console.warn('Roster scrape returned 0 players - manual update needed')
    return NextResponse.json({ ok: false, message: 'Scrape returned no players. Manual update needed.', scraped: 0 })
  }

  let upserted = 0
  for (const player of players) {
    const { error } = await supabaseAdmin
      .from('players')
      .upsert(
        {
          name: player.name,
          jersey_number: player.jersey_number,
          position: player.position,
          headshot_url: player.headshot_url,
          is_active: true,
          last_updated: new Date().toISOString(),
        },
        { onConflict: 'name' }
      )
    if (!error) upserted++
  }

  return NextResponse.json({ ok: true, scraped: players.length, upserted })
}
