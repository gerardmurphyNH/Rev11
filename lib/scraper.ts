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
const SCHEDULE_URL = `${REVS_BASE_URL}/schedule/#competition=all`

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
  const html = await fetchHtml(ROSTER_URL)
  if (!html) return []

  const $ = cheerio.load(html)
  const players: ScrapedPlayer[] = []

  // Try multiple selector patterns for the Revs website
  const selectors = [
    '.roster-player',
    '.player-card',
    '[data-player]',
    '.roster__player',
    '.team-roster .player',
  ]

  for (const sel of selectors) {
    const els = $(sel)
    if (els.length > 5) {
      els.each((_, el) => {
        const $el = $(el)
        const name = $el.find('.player-name, .name, [class*="name"]').first().text().trim()
          || $el.find('h3, h4').first().text().trim()
        if (!name) return

        const numberText = $el.find('.jersey-number, .number, [class*="number"]').first().text().trim()
        const jersey_number = numberText ? parseInt(numberText) || null : null

        const posText = $el.find('.position, [class*="position"]').first().text().trim()
        const position = posText ? normalizePosition(posText) : null

        const imgEl = $el.find('img').first()
        const headshot_url = imgEl.attr('src') || imgEl.attr('data-src') || null

        players.push({ name, jersey_number, position, headshot_url })
      })

      if (players.length > 5) break
    }
  }

  // Fallback: try JSON-LD or structured data
  if (players.length === 0) {
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const data = JSON.parse($(el).html() || '{}')
        if (data['@type'] === 'SportsTeam' && data.athlete) {
          for (const athlete of data.athlete) {
            players.push({
              name: athlete.name || '',
              jersey_number: null,
              position: null,
              headshot_url: athlete.image || null,
            })
          }
        }
      } catch { /* ignore */ }
    })
  }

  return players.filter(p => p.name.length > 1)
}

export async function scrapeSchedule(): Promise<ScrapedMatch[]> {
  // The schedule page is likely JS-rendered; attempt a fetch
  const html = await fetchHtml(SCHEDULE_URL)
  if (!html) return []

  const $ = cheerio.load(html)
  const matches: ScrapedMatch[] = []

  // Try common selectors
  const selectors = [
    '.match-card',
    '.schedule-match',
    '.game-card',
    '[class*="match"]',
    '[class*="game"]',
  ]

  for (const sel of selectors) {
    const els = $(sel)
    if (els.length > 0) {
      els.each((_, el) => {
        const $el = $(el)
        const opponent = $el.find('[class*="opponent"], [class*="team"]').not('[class*="home"]').first().text().trim()
        if (!opponent) return

        const dateText = $el.find('[class*="date"], time').first().text().trim()
        const timeText = $el.find('[class*="time"]').first().text().trim()
        if (!dateText) return

        // Try to parse date - best effort
        const rawDate = `${dateText} ${timeText}`.trim()
        let match_date = new Date().toISOString()
        try {
          const parsed = new Date(rawDate)
          if (!isNaN(parsed.getTime())) match_date = parsed.toISOString()
        } catch { /* ignore */ }

        const isHome = !$el.find('[class*="away"]').length

        const link = $el.find('a').first().attr('href') || null
        const match_url = link ? (link.startsWith('http') ? link : `${REVS_BASE_URL}${link}`) : null

        const comp = $el.find('[class*="competition"], [class*="league"]').first().text().trim() || 'MLS'

        matches.push({
          opponent,
          match_date,
          is_home: isHome,
          venue: isHome ? 'Gillette Stadium' : null,
          competition: comp,
          match_url,
        })
      })

      if (matches.length > 0) break
    }
  }

  return matches
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
