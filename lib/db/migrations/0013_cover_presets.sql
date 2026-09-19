DO $$ BEGIN
  CREATE TYPE "cover_preset_scope" AS ENUM ('mix', 'playlist', 'profile');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "cover_presets" (
  "id" text PRIMARY KEY NOT NULL,
  "scope" "cover_preset_scope" NOT NULL,
  "key" text NOT NULL,
  "label" text NOT NULL,
  "object_path" text,
  "builtin_key" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "cover_presets_source_check" CHECK (("object_path" IS NULL) <> ("builtin_key" IS NULL)),
  CONSTRAINT "cover_presets_sort_order_check" CHECK ("sort_order" >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS "cover_presets_scope_key_idx"
  ON "cover_presets" ("scope", "key");
CREATE UNIQUE INDEX IF NOT EXISTS "cover_presets_scope_sort_idx"
  ON "cover_presets" ("scope", "sort_order");

INSERT INTO "cover_presets" ("id", "scope", "key", "label", "builtin_key", "sort_order")
VALUES
  ('mix:cosmic-nebula', 'mix', 'cosmic-nebula', 'Nebulosa cósmica', 'cosmic-nebula', 0),
  ('mix:moon-valley', 'mix', 'moon-valley', 'Valle bajo la luna', 'moon-valley', 1),
  ('mix:earth-orbit', 'mix', 'earth-orbit', 'Planeta Tierra', 'earth-orbit', 2),
  ('mix:galaxy-lake', 'mix', 'galaxy-lake', 'Lago y galaxia', 'galaxy-lake', 3),
  ('mix:desert-stars', 'mix', 'desert-stars', 'Desierto estrellado', 'desert-stars', 4),
  ('mix:mist-forest', 'mix', 'mist-forest', 'Bosque con niebla', 'mist-forest', 5),
  ('mix:redwood-light', 'mix', 'redwood-light', 'Luz entre árboles', 'redwood-light', 6),
  ('mix:autumn-river', 'mix', 'autumn-river', 'Río de otoño', 'autumn-river', 7),
  ('mix:moss-waterfall', 'mix', 'moss-waterfall', 'Cascada entre musgo', 'moss-waterfall', 8),
  ('mix:snow-pines', 'mix', 'snow-pines', 'Pinos nevados', 'snow-pines', 9),
  ('mix:quiet-ocean', 'mix', 'quiet-ocean', 'Océano sereno', 'quiet-ocean', 10),
  ('mix:coastal-cliffs', 'mix', 'coastal-cliffs', 'Acantilados del mar', 'coastal-cliffs', 11),
  ('mix:river-canyon', 'mix', 'river-canyon', 'Río entre cañones', 'river-canyon', 12),
  ('mix:rain-lagoon', 'mix', 'rain-lagoon', 'Laguna bajo la lluvia', 'rain-lagoon', 13),
  ('mix:ice-lagoon', 'mix', 'ice-lagoon', 'Laguna de hielo', 'ice-lagoon', 14),
  ('mix:birds-dawn', 'mix', 'birds-dawn', 'Aves al amanecer', 'birds-dawn', 15),
  ('mix:crane-marsh', 'mix', 'crane-marsh', 'Grulla en el humedal', 'crane-marsh', 16),
  ('mix:elephant-savanna', 'mix', 'elephant-savanna', 'Elefante en la sabana', 'elephant-savanna', 17),
  ('mix:deer-meadow', 'mix', 'deer-meadow', 'Ciervo en el bosque', 'deer-meadow', 18),
  ('mix:whale-depths', 'mix', 'whale-depths', 'Ballena en el océano', 'whale-depths', 19),
  ('mix:wild-horses', 'mix', 'wild-horses', 'Caballos en la pradera', 'wild-horses', 20),
  ('mix:mountain-clouds', 'mix', 'mountain-clouds', 'Montañas entre nubes', 'mountain-clouds', 21),
  ('mix:volcanic-island', 'mix', 'volcanic-island', 'Isla volcánica', 'volcanic-island', 22),
  ('mix:lavender-hills', 'mix', 'lavender-hills', 'Colinas de lavanda', 'lavender-hills', 23),
  ('mix:northern-lights', 'mix', 'northern-lights', 'Aurora boreal', 'northern-lights', 24)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "cover_presets" ("id", "scope", "key", "label", "builtin_key", "sort_order")
SELECT replace("id", 'mix:', 'playlist:'), 'playlist', "key", "label", "builtin_key", "sort_order"
FROM "cover_presets" WHERE "scope" = 'mix'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "cover_presets" ("id", "scope", "key", "label", "builtin_key", "sort_order")
SELECT replace("id", 'mix:', 'profile:'), 'profile', "key", "label", "builtin_key", "sort_order"
FROM "cover_presets" WHERE "scope" = 'mix'
ON CONFLICT ("id") DO NOTHING;