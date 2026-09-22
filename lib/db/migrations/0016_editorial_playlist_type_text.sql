ALTER TABLE catalog_playlists
  ALTER COLUMN editorial_type DROP DEFAULT,
  ALTER COLUMN editorial_type TYPE text USING editorial_type::text,
  ALTER COLUMN editorial_type SET DEFAULT 'meditative';