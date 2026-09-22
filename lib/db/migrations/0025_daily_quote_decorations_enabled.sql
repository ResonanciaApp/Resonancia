ALTER TABLE daily_quote_settings
  ADD COLUMN IF NOT EXISTS decorations_enabled boolean NOT NULL DEFAULT true;