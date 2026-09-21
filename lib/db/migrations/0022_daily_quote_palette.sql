CREATE TABLE IF NOT EXISTS daily_quote_settings (
  id integer PRIMARY KEY,
  palette_id text NOT NULL DEFAULT 'jade',
  revision integer NOT NULL DEFAULT 1,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT daily_quote_settings_id_check CHECK (id = 1),
  CONSTRAINT daily_quote_settings_palette_check CHECK (palette_id IN ('jade', 'violet', 'ocean', 'ruby', 'amber')),
  CONSTRAINT daily_quote_settings_revision_check CHECK (revision > 0)
);

INSERT INTO daily_quote_settings (id, palette_id)
VALUES (1, 'jade')
ON CONFLICT (id) DO NOTHING;