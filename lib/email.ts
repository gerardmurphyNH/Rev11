import nodemailer from 'nodemailer'
import { formatMatchDateTime } from './utils'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

function baseEmailHtml(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { margin: 0; padding: 0; background-color: #0A2240; font-family: 'Arial', sans-serif; }
        .container { max-width: 600px; margin: 0 auto; background-color: #0D2D52; }
        .header { background-color: #0A2240; padding: 24px; text-align: center; border-bottom: 3px solid #CE0E2D; }
        .header h1 { color: #F5F0E8; font-size: 32px; letter-spacing: 4px; margin: 0; text-transform: uppercase; }
        .header .tagline { color: #C5A55A; font-size: 12px; letter-spacing: 2px; margin-top: 4px; }
        .body { padding: 32px 24px; color: #F5F0E8; }
        .footer { background-color: #061629; padding: 16px 24px; text-align: center; color: rgba(245,240,232,0.5); font-size: 12px; }
        .btn { display: inline-block; background-color: #CE0E2D; color: #F5F0E8; text-decoration: none; padding: 14px 28px; border-radius: 4px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 16px 0; }
        .score-badge { background-color: #0A2240; border: 2px solid #C5A55A; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .score-number { font-size: 48px; font-weight: bold; color: #C5A55A; line-height: 1; }
        .score-label { color: rgba(245,240,232,0.7); font-size: 14px; margin-top: 4px; }
        .player-row { display: flex; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(245,240,232,0.1); }
        .player-correct { color: #4CAF50; }
        .player-wrong { color: #CE0E2D; }
        .divider { height: 2px; background: linear-gradient(90deg, transparent, #CE0E2D, transparent); margin: 20px 0; }
        h2 { color: #C5A55A; text-transform: uppercase; letter-spacing: 2px; font-size: 16px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>REV11</h1>
          <div class="tagline">★ PREDICT THE STARTING XI ★</div>
        </div>
        <div class="body">
          ${content}
        </div>
        <div class="footer">
          <p>Rev11 — The Fort's Starting XI Predictor</p>
          <p>New England Revolution Fan App — Not affiliated with New England Revolution</p>
        </div>
      </div>
    </body>
    </html>
  `
}

export async function sendMatchReminderEmail(
  email: string,
  match: { opponent: string; match_date: string; id: string }
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const pickUrl = `${appUrl}/matches/${match.id}`

  const content = `
    <h2>⚔️ Midnight Rider's Alert</h2>
    <p style="font-size: 18px;">The Revs take on <strong>${match.opponent}</strong></p>
    <p style="color: #C5A55A;">${formatMatchDateTime(match.match_date)}</p>
    <div class="divider"></div>
    <p>Submit your Starting XI before the lock — 45 minutes before kickoff the gates close.</p>
    <a href="${pickUrl}" class="btn">Bring the Fight — Make Your Picks</a>
    <p style="color: rgba(245,240,232,0.5); font-size: 12px; margin-top: 16px;">
      Paul Revere didn't hesitate. Neither should you.
    </p>
  `

  await transporter.sendMail({
    from: `"Rev11 — The Fort" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `⚔️ Midnight Rider's Alert: ${match.opponent} match is approaching!`,
    html: baseEmailHtml(content),
  })
}

export async function sendResultsEmail(
  email: string,
  data: {
    match: { opponent: string; match_date: string; id: string }
    correctCount: number
    points: number
    isPerfect: boolean
    correctPlayerNames: string[]
    missedPlayerNames: string[]
    leaderboardRank: number
    totalUsers: number
  }
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const leaderboardUrl = `${appUrl}/leaderboard`
  const shareUrl = `${appUrl}/share/${data.match.id}`

  const perfectBanner = data.isPerfect ? `
    <div style="background: linear-gradient(135deg, #C5A55A, #D4B870); border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
      <div style="font-size: 24px; font-weight: bold; color: #0A2240; text-transform: uppercase; letter-spacing: 2px;">🎯 PERFECT SCORE!</div>
      <div style="color: #0A2240; margin-top: 8px;">The End Zone Militia fires for you! 11/11 — Muskets blazing!</div>
    </div>
  ` : ''

  const playerRows = [
    ...data.correctPlayerNames.map(name => `<div class="player-row"><span class="player-correct">✓</span>&nbsp;&nbsp;${name}</div>`),
    ...data.missedPlayerNames.map(name => `<div class="player-row"><span class="player-wrong">✗</span>&nbsp;&nbsp;${name}</div>`),
  ].join('')

  const content = `
    <h2>⚔️ Muskets Fired! — ${data.match.opponent}</h2>
    ${perfectBanner}
    <div class="score-badge">
      <div class="score-number">${data.correctCount}/11</div>
      <div class="score-label">${data.points} points earned</div>
    </div>
    <h2>Your Lineup Results</h2>
    <div>${playerRows}</div>
    <div class="divider"></div>
    <p>You're ranked <strong style="color: #C5A55A;">#${data.leaderboardRank}</strong> of ${data.totalUsers} fighters in The Fort.</p>
    <a href="${leaderboardUrl}" class="btn">View The Fort Leaderboard</a>
    <p style="margin-top: 12px;">
      <a href="${shareUrl}" style="color: #C5A55A;">Share your score →</a>
    </p>
  `

  await transporter.sendMail({
    from: `"Rev11 — The Fort" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: `⚔️ Muskets fired! Your Rev11 score for ${data.match.opponent}: ${data.correctCount}/11`,
    html: baseEmailHtml(content),
  })
}

export async function sendAdminLineupAlert(
  adminEmails: string[],
  data: {
    match: { opponent: string; match_date: string; id: string }
    playerNames: string[]
  }
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const confirmUrl = `${appUrl}/api/admin/confirm-lineup?matchId=${data.match.id}`
  const adminUrl = `${appUrl}/admin/lineup/${data.match.id}`

  const playerList = data.playerNames.map(n => `<li style="padding: 4px 0;">${n}</li>`).join('')

  const content = `
    <h2>🔍 Lineup Detected — Action Required</h2>
    <p>A lineup has been scraped for <strong>${data.match.opponent}</strong></p>
    <p style="color: #C5A55A;">${formatMatchDateTime(data.match.match_date)}</p>
    <div style="background: #0A2240; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <h3 style="color: #C5A55A; margin-top: 0;">Detected Starting XI:</h3>
      <ol style="color: #F5F0E8; margin: 0; padding-left: 20px;">${playerList}</ol>
    </div>
    <p>Confirm this lineup to trigger scoring and notifications:</p>
    <a href="${confirmUrl}" class="btn">✓ Confirm This Lineup</a>
    <p style="margin-top: 12px;">
      <a href="${adminUrl}" style="color: #C5A55A;">Or enter manually in admin →</a>
    </p>
    <p style="color: rgba(245,240,232,0.5); font-size: 12px;">If not confirmed within 30 minutes, a reminder will be sent.</p>
  `

  await transporter.sendMail({
    from: `"Rev11 — Admin" <${process.env.GMAIL_USER}>`,
    to: adminEmails.join(', '),
    subject: `⚔️ Rev11 Admin: Confirm lineup for ${data.match.opponent}`,
    html: baseEmailHtml(content),
  })
}

export async function sendAdminManualLineupRequest(
  adminEmails: string[],
  match: { opponent: string; match_date: string; id: string }
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const adminUrl = `${appUrl}/admin/lineup/${match.id}`

  const content = `
    <h2>⚠️ Manual Entry Required</h2>
    <p>The scraper could not detect the lineup for:</p>
    <p style="font-size: 18px; color: #C5A55A;"><strong>${match.opponent}</strong></p>
    <p>${formatMatchDateTime(match.match_date)}</p>
    <p>Please enter the starting XI manually:</p>
    <a href="${adminUrl}" class="btn">Enter Lineup Manually</a>
  `

  await transporter.sendMail({
    from: `"Rev11 — Admin" <${process.env.GMAIL_USER}>`,
    to: adminEmails.join(', '),
    subject: `⚠️ Rev11 Admin: Manual lineup entry needed for ${match.opponent}`,
    html: baseEmailHtml(content),
  })
}
