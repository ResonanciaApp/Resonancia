-- Expand the allowed palette set without modifying editorial settings or quotes.
ALTER TABLE daily_quote_settings DROP CONSTRAINT IF EXISTS daily_quote_settings_palette_check;
ALTER TABLE daily_quote_settings ADD CONSTRAINT daily_quote_settings_palette_check
  CHECK (palette_id IN ('jade', 'violet', 'ocean', 'ruby', 'amber', 'original', 'black16'));