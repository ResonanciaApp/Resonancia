-- Persistent state for the America/Santiago daily featured-session rotation.
-- Apply through the explicit development migration workflow; no runtime DDL.
CREATE TABLE IF NOT EXISTS featured_moment_state (
  id integer PRIMARY KEY DEFAULT 1,
  editorial_date date,
  automatic_session_id text,
  automatic_exposed boolean NOT NULL DEFAULT false,
  automatic_previous_last_id text,
  manual_session_id text,
  manual_date date,
  manual_from_legacy boolean NOT NULL DEFAULT false,
  pending_session_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  known_session_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  last_automatic_session_id text,
  last_shown_session_id text,
  revision integer NOT NULL DEFAULT 0,
  legacy_migrated boolean NOT NULL DEFAULT false
);