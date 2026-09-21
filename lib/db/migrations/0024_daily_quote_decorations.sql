ALTER TABLE daily_quote_settings
  ADD COLUMN IF NOT EXISTS decoration_id text NOT NULL DEFAULT 'circles';

ALTER TABLE daily_quote_settings
  DROP CONSTRAINT IF EXISTS daily_quote_settings_decoration_check;

ALTER TABLE daily_quote_settings
  ADD CONSTRAINT daily_quote_settings_decoration_check
  CHECK (decoration_id IN ('circles', 'vesica', 'seed', 'flower', 'metatron'));