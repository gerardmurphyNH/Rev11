import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { scrapeMatchLineup } from '@/lib/scraper'
import { sendAdminLineupAlert, sendAdminManualLineupRequest } from '@/lib/email'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('Authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Find matches that should have lineups available (60 min before kickoff, not yet confirmed)
  const now = new Date()
  const sixtyMinBefore = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
  const twoHoursBefore = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()

  const { data: matches } = await supabaseAdmin
    .from('matches')
    .select('id, opponent, match_date, match_url')
    .eq('status', 'upcoming')
    .lte('match_date', sixtyMinBefore)
    .gte('match_date', twoHoursBefore)

  if (!matches?.length) {
    return NextResponse.json({ ok: true, checked: 0 })
  }

  let checked = 0
  let alerted = 0

  for (const match of matches) {
    // Check if lineup already pending/confirmed
    const { data: existing } = await supabaseAdmin
      .from('correct_lineups')
      .select('status')
      .eq('match_id', match.id)
      .maybeSingle()

    if (existing?.status === 'confirmed') continue

    checked++

    if (match.match_url) {
      const scrapedNames = await scrapeMatchLineup(match.match_url)

      if (scrapedNames.length >= 10) {
        // Try to match scraped names to players in DB
        const { data: allPlayers } = await supabaseAdmin
          .from('players')
          .select('id, name')
          .eq('is_active', true)

        const matchedIds: string[] = []
        const matchedNames: string[] = []

        for (const scrapedName of scrapedNames) {
          const player = (allPlayers || []).find(p =>
            p.name.toLowerCase().includes(scrapedName.toLowerCase()) ||
            scrapedName.toLowerCase().includes(p.name.toLowerCase().split(' ').pop() || '')
          )
          if (player) {
            matchedIds.push(player.id)
            matchedNames.push(player.name)
          }
        }

        if (matchedIds.length >= 9) {
          // Store as pending and alert admins
          const { data: lineup } = await supabaseAdmin
            .from('correct_lineups')
            .upsert({ match_id: match.id, status: 'pending' }, { onConflict: 'match_id' })
            .select('id')
            .single()

          if (lineup) {
            await supabaseAdmin.from('correct_lineup_players').delete().eq('correct_lineup_id', lineup.id)
            await supabaseAdmin.from('correct_lineup_players').insert(
              matchedIds.map(player_id => ({ correct_lineup_id: lineup.id, player_id }))
            )
          }

          await sendAdminLineupAlert(adminEmails, {
            match,
            playerNames: matchedNames,
          })
          alerted++
        } else {
          // Scrape didn't match enough — manual needed
          await sendAdminManualLineupRequest(adminEmails, match)
          alerted++
        }
      } else {
        // No lineup detected yet — will retry in 10 min
      }
    } else {
      // No URL — ask admin
      if (!existing) {
        await sendAdminManualLineupRequest(adminEmails, match)
        alerted++
      }
    }
  }

  return NextResponse.json({ ok: true, checked, alerted })
}
