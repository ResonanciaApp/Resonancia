-- NULL keeps the original below-quote layout for existing stories.
ALTER TABLE reflection_stories ADD COLUMN IF NOT EXISTS avatar_x real;
ALTER TABLE reflection_stories ADD COLUMN IF NOT EXISTS avatar_y real;
