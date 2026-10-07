-- Additive and backward-compatible; old stories omit the avatar.
ALTER TABLE users ADD COLUMN IF NOT EXISTS long_description text;
ALTER TABLE reflection_stories ADD COLUMN IF NOT EXISTS avatar_image_path text;
