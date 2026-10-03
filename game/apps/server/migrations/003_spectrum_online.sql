-- 003_spectrum_online.sql — Spectrum ranked LB fields (solved / guesses)

ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS solved BOOLEAN,
  ADD COLUMN IF NOT EXISTS guesses_used INTEGER;

CREATE INDEX IF NOT EXISTS leaderboard_spectrum_sort_idx
  ON leaderboard_entries (
    challenge_id,
    ranked DESC,
    solved DESC,
    guesses_used ASC,
    duration_ms ASC,
    completed_at ASC
  );
