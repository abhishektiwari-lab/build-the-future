-- ============================================================
-- FIX: Add missing RLS policies
-- ============================================================
-- Run this ONCE in the Supabase SQL Editor if you already ran
-- the original schema.sql and the app can't read/write data.
--
-- Root cause: RLS was enabled on all tables but no policies were
-- defined, which denies the anon key (used by the app) all access.
-- ============================================================

CREATE POLICY "Allow all access to participants" ON participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to submissions" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to judges" ON judges FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to scores" ON scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to event_state" ON event_state FOR ALL USING (true) WITH CHECK (true);

-- Verify policies were created:
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename;
