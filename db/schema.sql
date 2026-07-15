-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Participants table
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'participant',
  team_id UUID,
  session_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  presentation_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for participants
ALTER TABLE participants
  ADD CONSTRAINT fk_participants_teams
  FOREIGN KEY (team_id)
  REFERENCES teams(id) ON DELETE SET NULL;

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL UNIQUE,
  prototype_name TEXT,
  current_product_or_process TEXT,
  persona TEXT,
  job_to_be_done TEXT,
  problem TEXT,
  ai_native_solution TEXT,
  expected_outcomes TEXT,
  demo_url TEXT,
  supporting_url TEXT,
  image_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_submissions_teams
    FOREIGN KEY (team_id)
    REFERENCES teams(id) ON DELETE CASCADE
);

-- Judges table
CREATE TABLE IF NOT EXISTS judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  access_code TEXT UNIQUE NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  judge_id UUID NOT NULL,
  team_id UUID NOT NULL,
  customer_outcome INTEGER NOT NULL CHECK (customer_outcome >= 1 AND customer_outcome <= 10),
  ai_native_thinking INTEGER NOT NULL CHECK (ai_native_thinking >= 1 AND ai_native_thinking <= 10),
  innovation_and_vision INTEGER NOT NULL CHECK (innovation_and_vision >= 1 AND innovation_and_vision <= 10),
  comment TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(judge_id, team_id),
  CONSTRAINT fk_scores_judges FOREIGN KEY (judge_id) REFERENCES judges(id) ON DELETE CASCADE,
  CONSTRAINT fk_scores_teams FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- Event state table (only one row)
CREATE TABLE IF NOT EXISTS event_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  registration_open BOOLEAN DEFAULT true,
  submissions_open BOOLEAN DEFAULT false,
  judging_open BOOLEAN DEFAULT false,
  judging_locked BOOLEAN DEFAULT false,
  current_team_id UUID,
  leaderboard_visible BOOLEAN DEFAULT false,
  winner_reveal_state TEXT DEFAULT 'hidden',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_event_state_teams FOREIGN KEY (current_team_id) REFERENCES teams(id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_participants_team_id ON participants(team_id);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_submissions_team_id ON submissions(team_id);
CREATE INDEX IF NOT EXISTS idx_scores_judge_id ON scores(judge_id);
CREATE INDEX IF NOT EXISTS idx_scores_team_id ON scores(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_join_code ON teams(join_code);

-- Enable Row Level Security
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE judges ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_state ENABLE ROW LEVEL SECURITY;

-- Access policies
-- This is an internal, trusted-user event app that uses the anon key
-- for all reads and writes. RLS is enabled above, so we must define
-- policies that allow the anon role to operate — without these, every
-- insert/select/update/delete is denied and the app appears "broken".
CREATE POLICY "Allow all access to participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to judges" ON judges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scores" ON scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to event_state" ON event_state FOR ALL USING (true) WITH CHECK (true);

-- Table-level privileges for the anon/authenticated roles the app uses.
-- RLS policies above decide WHICH ROWS; these GRANTs decide whether the
-- role can touch the table AT ALL. Both are required.
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- Create view for leaderboard calculations
CREATE OR REPLACE VIEW team_scores AS
SELECT
  t.id,
  t.name,
  t.presentation_order,
  s.prototype_name,
  ROUND(AVG(sc.customer_outcome)::numeric, 2) as avg_customer_outcome,
  ROUND(AVG(sc.ai_native_thinking)::numeric, 2) as avg_ai_native_thinking,
  ROUND(AVG(sc.innovation_and_vision)::numeric, 2) as avg_innovation_and_vision,
  ROUND(AVG((sc.customer_outcome + sc.ai_native_thinking + sc.innovation_and_vision) / 3.0)::numeric, 2) as overall_score,
  COUNT(DISTINCT sc.judge_id) as judges_completed,
  (SELECT COUNT(*) FROM judges WHERE active = true) as total_judges
FROM teams t
LEFT JOIN submissions s ON t.id = s.team_id
LEFT JOIN scores sc ON t.id = sc.team_id
GROUP BY t.id, t.name, t.presentation_order, s.prototype_name;

-- Function to calculate rank with tie-breaking
CREATE OR REPLACE FUNCTION get_team_ranking()
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  prototype_name TEXT,
  overall_score NUMERIC,
  avg_customer_outcome NUMERIC,
  avg_ai_native_thinking NUMERIC,
  avg_innovation_and_vision NUMERIC,
  judges_completed BIGINT,
  rank INT
) AS $$
SELECT
  id,
  name,
  prototype_name,
  overall_score,
  avg_customer_outcome,
  avg_ai_native_thinking,
  avg_innovation_and_vision,
  judges_completed,
  ROW_NUMBER() OVER (
    ORDER BY
      overall_score DESC,
      avg_customer_outcome DESC,
      avg_ai_native_thinking DESC,
      avg_innovation_and_vision DESC
  ) as rank
FROM team_scores
ORDER BY rank;
$$ LANGUAGE SQL;
