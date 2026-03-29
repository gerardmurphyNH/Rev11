import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { scoreMatch } from '@/lib/scoring'

// One-click confirm from email link
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const matchId = searchParams.get('matchId')

  if (!matchId) {
    return new NextResponse('Invalid link', { status: 400 })
  }

  const { data: lineup } = await supabaseAdmin
    .from('correct_lineups')
    .select('id, status')
    .eq('match_id', matchId)
    .maybeSingle()

  if (!lineup) {
    return new NextResponse('No pending lineup found for this match', { status: 404 })
  }

  if (lineup.status === 'confirmed') {
    return new NextResponse(confirmHtml('Already confirmed!'), {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  // Confirm it
  await supabaseAdmin
    .from('correct_lineups')
    .update({
      status: 'confirmed',
      confirmed_by: 'email-link',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', lineup.id)

  const { scored } = await scoreMatch(matchId)

  return new NextResponse(confirmHtml(`✓ Lineup confirmed! ${scored} predictions scored.`), {
    headers: { 'Content-Type': 'text/html' },
  })
}

function confirmHtml(message: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><title>Rev11 Admin</title>
    <style>body{font-family:Arial;background:#0A2240;color:#F5F0E8;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;}
    .card{background:#0D2D52;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:40px;max-width:400px;}
    h1{color:#C5A55A;font-size:28px;letter-spacing:4px;text-transform:uppercase;}
    p{color:rgba(245,240,232,.7);}
    a{color:#CE0E2D;}</style>
    </head>
    <body>
    <div class="card">
      <h1>REV11</h1>
      <p>${message}</p>
      <p><a href="/admin">Go to admin dashboard →</a></p>
    </div>
    </body>
    </html>
  `
}
