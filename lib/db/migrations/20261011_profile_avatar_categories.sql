BEGIN;
CREATE TABLE IF NOT EXISTS profile_avatar_categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  normalized_name text NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS profile_avatar_categories_name_idx ON profile_avatar_categories(normalized_name);
CREATE TABLE IF NOT EXISTS profile_avatar_memberships (
  preset_id text NOT NULL REFERENCES cover_presets(id) ON DELETE CASCADE,
  category_id text NOT NULL REFERENCES profile_avatar_categories(id) ON DELETE CASCADE,
  PRIMARY KEY(preset_id, category_id)
);
CREATE INDEX IF NOT EXISTS profile_avatar_memberships_category_idx ON profile_avatar_memberships(category_id);
COMMIT;
