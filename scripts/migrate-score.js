// Migration: add score prediction columns to predictions and matches tables
// Usage: SUPABASE_SERVICE_ROLE_KEY=<key> SUPABASE_URL=<url> node scripts/migrate-score.js
//
// Or just run the SQL below directly in the Supabase SQL editor:
//
//   ALTER TABLE predictions
//     ADD COLUMN IF NOT EXISTS predicted_revs_score INTEGER,
//     ADD COLUMN IF NOT EXISTS predicted_opp_score INTEGER,
//     ADD COLUMN IF NOT EXISTS score_points_earned INTEGER;
//
//   ALTER TABLE matches
//     ADD COLUMN IF NOT EXISTS revs_score INTEGER,
//     ADD COLUMN IF NOT EXISTS opp_score INTEGER;

const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(url, key)

async function checkColumns() {
  const { data: pred } = await supabase.from('predictions').select('*').limit(1)
  const { data: match } = await supabase.from('matches').select('*').limit(1)
  console.log('predictions columns:', pred?.length ? Object.keys(pred[0]) : '(no rows)')
  console.log('matches columns:', match?.length ? Object.keys(match[0]) : '(no rows)')
}

checkColumns().then(() => {
  console.log('\nPlease run the following SQL in the Supabase SQL editor to add the new columns:')
  console.log(`
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS predicted_revs_score INTEGER,
  ADD COLUMN IF NOT EXISTS predicted_opp_score INTEGER,
  ADD COLUMN IF NOT EXISTS score_points_earned INTEGER;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS revs_score INTEGER,
  ADD COLUMN IF NOT EXISTS opp_score INTEGER;
`)
})
