CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  selected_category_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  selected_editorial_tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications
  ALTER COLUMN actor_user_id DROP NOT NULL;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS session_id text,
  ADD COLUMN IF NOT EXISTS message text;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_session_published_unique
  ON notifications (user_id, session_id)
  WHERE type = 'session_published' AND session_id IS NOT NULL;