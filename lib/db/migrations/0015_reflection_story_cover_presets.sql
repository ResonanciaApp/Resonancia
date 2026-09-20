DO $$ BEGIN
  ALTER TYPE "cover_preset_scope" ADD VALUE IF NOT EXISTS 'reflection-story';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;