CREATE TABLE IF NOT EXISTS community_presence (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  PRIMARY KEY (user_id, session_id)
);
CREATE INDEX IF NOT EXISTS community_presence_active_idx
  ON community_presence(last_seen_at) WHERE closed_at IS NULL;