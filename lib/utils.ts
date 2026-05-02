import { formatInTimeZone } from 'date-fns-tz'
import { format, parseISO, isPast, differenceInMinutes, differenceInSeconds } from 'date-fns'

const EASTERN_TZ = 'America/New_York'
const LOCK_MINUTES_BEFORE = 60

export function formatMatchDate(dateStr: string): string {
  return formatInTimeZone(parseISO(dateStr), EASTERN_TZ, 'EEE, MMM d')
}

export function formatMatchTime(dateStr: string): string {
  return formatInTimeZone(parseISO(dateStr), EASTERN_TZ, 'h:mm a z')
}

export function formatMatchDateTime(dateStr: string): string {
  return formatInTimeZone(parseISO(dateStr), EASTERN_TZ, 'EEE, MMM d • h:mm a z')
}

export function getLockTime(matchDate: string): Date {
  const kickoff = parseISO(matchDate)
  return new Date(kickoff.getTime() - LOCK_MINUTES_BEFORE * 60 * 1000)
}

export function isMatchLocked(matchDate: string): boolean {
  return isPast(getLockTime(matchDate))
}

export function getCountdownParts(matchDate: string): {
  days: number
  hours: number
  minutes: number
  seconds: number
  isLocked: boolean
  totalSeconds: number
} {
  const lockTime = getLockTime(matchDate)
  const now = new Date()
  const totalSeconds = differenceInSeconds(lockTime, now)

  if (totalSeconds <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isLocked: true, totalSeconds: 0 }
  }

  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return { days, hours, minutes, seconds, isLocked: false, totalSeconds }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local}***@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

export function getDisplayName(user: { display_name: string | null; email: string }): string {
  return user.display_name || maskEmail(user.email)
}

export function calcPoints(correctCount: number): number {
  if (correctCount === 11) return 14 // 11 + 3 bonus
  return correctCount
}

export function calcScorePoints(
  predictedRevs: number | null | undefined,
  predictedOpp: number | null | undefined,
  actualRevs: number,
  actualOpp: number
): number {
  if (predictedRevs == null || predictedOpp == null) return 0
  let pts = 0
  if (predictedRevs === actualRevs) pts++   // correct Revs goals
  if (predictedOpp === actualOpp) pts++     // correct opponent goals
  const predResult = predictedRevs > predictedOpp ? 'w' : predictedRevs < predictedOpp ? 'l' : 'd'
  const actualResult = actualRevs > actualOpp ? 'w' : actualRevs < actualOpp ? 'l' : 'd'
  if (predResult === actualResult) pts++    // correct result (win/draw/loss)
  if (predictedRevs === actualRevs && predictedOpp === actualOpp) pts += 1 // exact scoreline bonus
  return pts
}

export function classNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function getPositionOrder(position: string | null): number {
  switch (position) {
    case 'GK': return 0
    case 'DEF': return 1
    case 'MID': return 2
    case 'FWD': return 3
    default: return 4
  }
}

export function groupPlayersByPosition<T extends { position: string | null }>(players: T[]): Record<string, T[]> {
  const groups: Record<string, T[]> = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  }
  for (const p of players) {
    const pos = p.position || 'MID'
    if (groups[pos]) groups[pos].push(p)
    else groups['MID'].push(p)
  }
  return groups
}

export function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())
  return adminEmails.includes(email)
}

export function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}
