-- 002_pixel_online.sql — ranked daily LB fields for server-verified Pixel Lab

ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS correct_count INTEGER,
  ADD COLUMN IF NOT EXISTS duration_ms INTEGER,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ranked BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS game_version TEXT,
  ADD COLUMN IF NOT EXISTS content_version TEXT;

CREATE INDEX IF NOT EXISTS leaderboard_ranked_sort_idx
  ON leaderboard_entries (
    challenge_id,
    ranked DESC,
    correct_count DESC,
    duration_ms ASC,
    completed_at ASC
  );

ALTER TABLE game_runs
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ranked BOOLEAN;

CREATE INDEX IF NOT EXISTS game_runs_user_challenge_status_idx
  ON game_runs (user_id, challenge_id, status);
