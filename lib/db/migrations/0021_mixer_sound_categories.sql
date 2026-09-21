CREATE TABLE IF NOT EXISTS mixer_sound_categories (
  id text PRIMARY KEY,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

INSERT INTO mixer_sound_categories (id, label, sort_order)
VALUES
  ('animales', 'Animales', 0),
  ('bosque', 'Bosque', 1),
  ('mar', 'Mar', 2),
  ('fuego', 'Fuego', 3),
  ('desierto', 'Desierto', 4),
  ('cuencos_tibetanos', 'Cuencos Tibetanos', 5),
  ('cuencos_cuarzo', 'Cuencos de Cuarzo', 6),
  ('gongs', 'Gongs', 7),
  ('campanas_viento', 'Campanas de Viento', 8),
  ('vientos', 'Vientos', 9),
  ('cantos', 'Cantos', 10),
  ('percusion', 'Percusión', 11),
  ('mantras', 'Mantras', 12),
  ('solfeggio', 'Solfeggio', 13),
  ('ruidos', 'Ruidos', 14),
  ('frecuencias', 'Frecuencias', 15),
  ('asmr', 'ASMR', 16),
  ('bpm', 'BPM', 17),
  ('binaural', 'Binaurales', 18)
ON CONFLICT (id) DO NOTHING;

-- Preserve any category introduced before this migration instead of blocking
-- the foreign key. Editors can rename or reorder it later from Admin.
INSERT INTO mixer_sound_categories (id, label, sort_order)
SELECT DISTINCT
  category_id,
  initcap(replace(category_id, '_', ' ')),
  100
FROM mixer_sounds
ON CONFLICT (id) DO NOTHING;

ALTER TABLE mixer_sounds
  ADD CONSTRAINT mixer_sounds_category_id_fk
  FOREIGN KEY (category_id) REFERENCES mixer_sound_categories(id);