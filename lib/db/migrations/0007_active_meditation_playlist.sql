ALTER TABLE "user_library"
ADD COLUMN IF NOT EXISTS "active_meditation_playlist" jsonb;