BEGIN;
CREATE TABLE IF NOT EXISTS inspirations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  draft jsonb NOT NULL,
  published jsonb,
  published_revision integer,
  deleted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT inspirations_snapshot_check CHECK ((published IS NULL) = (published_revision IS NULL)),
  CONSTRAINT inspirations_deleted_check CHECK (NOT deleted OR published IS NULL)
);
CREATE TABLE IF NOT EXISTS inspiration_settings (
  id integer PRIMARY KEY CHECK (id = 1),
  revision integer NOT NULL CHECK (revision > 0),
  labels jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS inspiration_assets (
  object_path text PRIMARY KEY,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp')),
  size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 15728640),
  generation text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS inspiration_favorites (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  inspiration_id uuid NOT NULL,
  revision integer NOT NULL CHECK (revision > 0),
  deleted boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, inspiration_id)
);
CREATE TABLE IF NOT EXISTS inspiration_notes (
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id uuid NOT NULL,
  inspiration_id uuid NOT NULL,
  text text NOT NULL CHECK (length(text) <= 20000),
  revision integer NOT NULL CHECK (revision > 0),
  deleted boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id),
  CONSTRAINT inspiration_notes_deleted_check CHECK (NOT deleted OR text = '')
);
CREATE INDEX IF NOT EXISTS inspiration_notes_owner_inspiration_idx ON inspiration_notes(user_id, inspiration_id);
COMMIT;