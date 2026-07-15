-- ============================================================
-- FIX: Grant table privileges + RLS policies for the anon role
-- ============================================================
-- Run this ONCE in the Supabase SQL Editor if the app returns
-- "permission denied for table ..." (code 42501) or can't
-- read/write data.
--
-- Two independent layers must both allow access:
--   1. Table GRANTs  -> can the role touch the table at all?
--   2. RLS policies  -> which rows may it touch?
-- The original schema set up neither for anon, so every request
-- from the app (which uses the anon key) was denied.
-- ============================================================

-- 1. Table + schema privileges for the roles the app uses
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Make sure any future tables/functions inherit the same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- 2. RLS policies (idempotent — safe to re-run)
DROP POLICY IF EXISTS "Allow all access to participants" ON participants;
DROP POLICY IF EXISTS "Allow all access to teams" ON teams;
DROP POLICY IF EXISTS "Allow all access to submissions" ON submissions;
DROP POLICY IF EXISTS "Allow all access to judges" ON judges;
DROP POLICY IF EXISTS "Allow all access to scores" ON scores;
DROP POLICY IF EXISTS "Allow all access to event_state" ON event_state;

CREATE POLICY "Allow all access to participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to judges" ON judges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scores" ON scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to event_state" ON event_state FOR ALL USING (true) WITH CHECK (true);

-- Verify:
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee = 'anon'
ORDER BY table_name;
