import * as cheerio from 'cheerio'

export interface ScrapedPlayer {
  name: string
  jersey_number: number | null
  position: string | null
  headshot_url: string | null
}

export interface ScrapedMatch {
  opponent: string
  match_date: string // ISO UTC string
  is_home: boolean
  venue: string | null
  competition: string
  match_url: string | null
}

const REVS_BASE_URL = 'https://www.revolutionsoccer.net'
const ROSTER_URL = `${REVS_BASE_URL}/roster/`
const REVS_ESPN_ID = '189' // New England Revolution ESPN team ID

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Rev11Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

function normalizePosition(raw: string): 'GK' | 'DEF' | 'MID' | 'FWD' | null {
  const val = raw.toUpperCase()
  if (val.includes('GOAL') || val === 'GK' || val === 'G') return 'GK'
  if (val.includes('DEFEND') || val === 'DEF' || val === 'D' || val === 'CB' || val === 'LB' || val === 'RB') return 'DEF'
  if (val.includes('MID') || val === 'MF' || val === 'M' || val === 'CM' || val === 'DM' || val === 'AM') return 'MID'
  if (val.includes('FORWARD') || val.includes('STRIKER') || val === 'FWD' || val === 'F' || val === 'LW' || val === 'RW') return 'FWD'
  return null
}

export async function scrapeRoster(): Promise<ScrapedPlayer[]> {
  // Use ESPN's public API — Revolution's roster page is JS-rendered and can't be scraped directly
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/teams/${REVS_ESPN_ID}/roster`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return []

    const data = await res.json()
    const athletes: unknown[] = data.athletes || []

    return athletes
      .map(a => {
        const athlete = a as Record<string, unknown>
        const name = String(athlete.displayName || athlete.fullName || '')
        if (!name) return null

        const jersey = athlete.jersey ? parseInt(String(athlete.jersey)) || null : null
        const posAbbr = (athlete.position as Record<string, unknown>)?.abbreviation as string | undefined
        const position = posAbbr ? normalizePosition(posAbbr) : null
        const headshot_url = (athlete.headshot as Record<string, unknown>)?.href as string | null ?? null

        return { name, jersey_number: jersey, position, headshot_url }
      })
      .filter((p): p is ScrapedPlayer => p !== null && p.name.length > 1)
  } catch {
    return []
  }
}

export async function scrapeSchedule(): Promise<ScrapedMatch[]> {
  // Use ESPN's public API — Revolution's schedule page is JS-rendered and can't be scraped directly
  try {
    const today = new Date()
    const endOfYear = new Date(today.getFullYear(), 11, 31)
    const fmt = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, '')
    const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard?limit=200&dates=${fmt(today)}-${fmt(endOfYear)}`

    const res = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return []

    const data = await res.json()
    const events: unknown[] = data.events || []
    const matches: ScrapedMatch[] = []

    for (const event of events) {
      const e = event as Record<string, unknown>
      const competition = (e.competitions as Record<string, unknown>[])?.[0]
      if (!competition) continue

      const competitors = (competition.competitors as Record<string, unknown>[]) || []
      const revs = competitors.find(c => {
        const team = c.team as Record<string, unknown>
        return team?.id === REVS_ESPN_ID || String(team?.displayName || '').includes('Revolution')
      })
      const opponent = competitors.find(c => {
        const team = c.team as Record<string, unknown>
        return team?.id !== REVS_ESPN_ID && !String(team?.displayName || '').includes('Revolution')
      })

      if (!revs || !opponent) continue

      const opponentTeam = opponent.team as Record<string, unknown>
      const opponentName = String(opponentTeam?.displayName || opponentTeam?.shortDisplayName || '')
      if (!opponentName) continue

      const isHome = revs.homeAway === 'home'
      const match_date = String(competition.date || e.date || '')
      if (!match_date) continue

      const venue = (competition.venue as Record<string, unknown>)?.fullName as string | null
      const link = ((e.links as Record<string, unknown>[])?.[0]?.href as string) || null

      // Determine competition from season info
      const seasonName = String((e.season as Record<string, unknown>)?.type?.name || '')
      const competition_name = seasonName.toLowerCase().includes('open cup') ? 'US Open Cup'
        : seasonName.toLowerCase().includes('concacaf') ? 'Concacaf Champions Cup'
        : 'MLS'

      matches.push({
        opponent: opponentName,
        match_date: new Date(match_date).toISOString(),
        is_home: isHome,
        venue: venue || (isHome ? 'Gillette Stadium' : null),
        competition: competition_name,
        match_url: link,
      })
    }

    return matches
  } catch {
    return []
  }
}

export async function scrapeMatchLineup(matchUrl: string): Promise<string[]> {
  if (!matchUrl) return []

  const html = await fetchHtml(matchUrl)
  if (!html) return []

  const $ = cheerio.load(html)
  const players: string[] = []

  // Look for lineup sections
  const lineupSelectors = [
    '.lineup-player',
    '[class*="lineup"] [class*="player"]',
    '[class*="starting-xi"]',
    '[class*="formation"] [class*="player"]',
    '.match-lineup .player-name',
  ]

  for (const sel of lineupSelectors) {
    const els = $(sel)
    if (els.length >= 10) {
      els.each((_, el) => {
        const name = $(el).text().trim()
        if (name && name.length > 1) players.push(name)
      })
      if (players.length >= 10) break
    }
  }

  return players.slice(0, 11)
}
