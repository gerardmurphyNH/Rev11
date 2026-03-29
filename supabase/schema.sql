-- Rev11 Database Schema
-- Run this in your Supabase SQL editor

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  total_points INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  perfect_scores INTEGER DEFAULT 0
);

-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  jersey_number INTEGER,
  position TEXT CHECK (position IN ('GK', 'DEF', 'MID', 'FWD')),
  headshot_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_updated TIMESTAMPTZ DEFAULT now()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  is_home BOOLEAN DEFAULT true,
  venue TEXT,
  competition TEXT DEFAULT 'MLS',
  match_url TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'locked', 'completed')),
  locked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(opponent, match_date)
);

-- Predictions table
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_locked BOOLEAN DEFAULT false,
  points_earned INTEGER,
  is_perfect BOOLEAN DEFAULT false,
  UNIQUE(user_id, match_id)
);

-- Prediction players (many-to-many picks)
CREATE TABLE prediction_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(prediction_id, player_id)
);

-- Correct lineups (set by admin after match)
CREATE TABLE correct_lineups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE NOT NULL UNIQUE,
  confirmed_by TEXT,
  confirmed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'error')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Correct lineup players
CREATE TABLE correct_lineup_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correct_lineup_id UUID REFERENCES correct_lineups(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(correct_lineup_id, player_id)
);

-- Indexes
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_match_id ON predictions(match_id);
CREATE INDEX idx_prediction_players_prediction_id ON prediction_players(prediction_id);
CREATE INDEX idx_correct_lineup_players_lineup_id ON correct_lineup_players(correct_lineup_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_match_date ON matches(match_date);
CREATE INDEX idx_users_total_points ON users(total_points DESC);

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE correct_lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE correct_lineup_players ENABLE ROW LEVEL SECURITY;

-- Public read for players, matches, correct lineups
CREATE POLICY "Players are publicly readable" ON players FOR SELECT USING (true);
CREATE POLICY "Matches are publicly readable" ON matches FOR SELECT USING (true);
CREATE POLICY "Confirmed lineups are publicly readable" ON correct_lineups FOR SELECT USING (status = 'confirmed');
CREATE POLICY "Correct lineup players are publicly readable" ON correct_lineup_players FOR SELECT USING (true);

-- Users: public read for leaderboard
CREATE POLICY "Users are publicly readable" ON users FOR SELECT USING (true);

-- Service role bypasses RLS (for server-side operations)
-- The app uses supabaseAdmin (service role) for all mutations

-- Seed: 2026 Revolution roster (update with actual squad)
INSERT INTO players (name, jersey_number, position) VALUES
  ('Djordje Petrovic', 1, 'GK'),
  ('Earl Edwards Jr.', 18, 'GK'),
  ('Andrew Farrell', 2, 'DEF'),
  ('DeJuan Jones', 24, 'DEF'),
  ('Dave Romney', 4, 'DEF'),
  ('Henry Kessler', 27, 'DEF'),
  ('Brandon Bye', 15, 'DEF'),
  ('Ian Harkes', 14, 'MID'),
  ('Luca Langoni', 19, 'MID'),
  ('Esmir Bajraktarevic', 7, 'MID'),
  ('Matt Polster', 8, 'MID'),
  ('Maciel', 5, 'MID'),
  ('Carles Gil', 10, 'MID'),
  ('Bobby Wood', 9, 'FWD'),
  ('Tomas Chancalay', 77, 'FWD'),
  ('Justin Rennicks', 11, 'FWD'),
  ('Dylan Borrero', 17, 'FWD'),
  ('Giacomo Vrioni', 9, 'FWD')
ON CONFLICT (name) DO NOTHING;
