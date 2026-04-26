-- Minimalist schema for F1 2026 Friends
-- Users are pre-configured with a secret_token for access

CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  secret_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE races (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'upcoming', -- upcoming, live, finished
  results JSONB, -- Final results for comparison
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  race_id UUID REFERENCES races(id) ON DELETE CASCADE NOT NULL,
  quali_top_10 JSONB NOT NULL, -- Array of driver IDs/names for Quali
  race_top_10 JSONB NOT NULL,  -- Array of driver IDs/names for Race
  custom_bet TEXT,             -- Text for the custom bet
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(player_id, race_id)
);

-- Insert 4 players as requested
INSERT INTO players (name) VALUES ('Hugo'), ('Ami 1'), ('Ami 2'), ('Ami 3');

-- Enable RLS
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE races ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON players FOR SELECT USING (true);
CREATE POLICY "Public read" ON races FOR SELECT USING (true);
CREATE POLICY "Public read" ON predictions FOR SELECT USING (true);
CREATE POLICY "Update predictions with token" ON predictions FOR ALL USING (true);
