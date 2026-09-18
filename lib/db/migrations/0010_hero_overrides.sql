CREATE TABLE IF NOT EXISTS hero_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  draft jsonb NOT NULL,
  published jsonb,
  published_revision integer,
  deleted boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT hero_overrides_snapshot_check CHECK ((published IS NULL) = (published_revision IS NULL)),
  CONSTRAINT hero_overrides_deleted_check CHECK (NOT deleted OR published IS NULL)
);
CREATE TABLE IF NOT EXISTS hero_override_assets (
  object_path text PRIMARY KEY,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg','image/png','image/webp','video/mp4','video/webm')),
  size_bytes integer NOT NULL CHECK (size_bytes BETWEEN 1 AND 104857600),
  generation text,
  created_at timestamptz NOT NULL DEFAULT now()
);