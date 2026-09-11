CREATE TABLE IF NOT EXISTS sleep_carousel_order (
  id serial PRIMARY KEY,
  key text NOT NULL UNIQUE,
  type text NOT NULL CHECK (type IN ('session', 'playlist')),
  label text NOT NULL,
  visible boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);