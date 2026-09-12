DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'mixer_sounds'
      AND column_name = 'is_featured'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'mixer_sounds'
      AND column_name = 'show_in_meditation_backgrounds'
  ) THEN
    ALTER TABLE "mixer_sounds"
    RENAME COLUMN "is_featured" TO "show_in_meditation_backgrounds";
  ELSIF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = current_schema()
      AND table_name = 'mixer_sounds'
      AND column_name = 'show_in_meditation_backgrounds'
  ) THEN
    ALTER TABLE "mixer_sounds"
    ADD COLUMN "show_in_meditation_backgrounds" boolean NOT NULL DEFAULT false;
  END IF;
END $$;