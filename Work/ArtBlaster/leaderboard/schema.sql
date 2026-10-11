-- Art Blaster! leaderboard (Cloudflare D1)
CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  bill       INTEGER NOT NULL CHECK (bill > 0),
  destroyed  INTEGER NOT NULL DEFAULT 0,
  top_piece  TEXT,
  rank_title TEXT,
  ip_hash    TEXT    NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS scores_by_bill ON scores (bill DESC);
CREATE INDEX IF NOT EXISTS scores_by_ip ON scores (ip_hash, created_at);
