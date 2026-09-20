WITH slots AS (
  SELECT
    slot,
    CASE
      WHEN slot < 100 THEN LPAD(slot::text, 2, '0')
      ELSE slot::text
    END AS slot_key
  FROM generate_series(1, 100) AS generated(slot)
)
INSERT INTO "cover_presets" ("id", "scope", "key", "label", "builtin_key", "sort_order")
SELECT
  'reflection-story:' || slot_key,
  'reflection-story',
  slot_key,
  'Fondo de historia ' || slot_key,
  (
    ARRAY[
      'cosmic-nebula', 'moon-valley', 'earth-orbit', 'galaxy-lake', 'desert-stars',
      'mist-forest', 'redwood-light', 'autumn-river', 'moss-waterfall', 'snow-pines',
      'quiet-ocean', 'coastal-cliffs', 'river-canyon', 'rain-lagoon', 'ice-lagoon',
      'birds-dawn', 'crane-marsh', 'elephant-savanna', 'deer-meadow', 'whale-depths',
      'wild-horses', 'mountain-clouds', 'volcanic-island', 'lavender-hills', 'northern-lights'
    ]
  )[((slot - 1) % 25) + 1],
  slot - 1
FROM slots
ON CONFLICT ("id") DO UPDATE SET
  "label" = EXCLUDED."label",
  "builtin_key" = CASE
    WHEN "cover_presets"."object_path" IS NULL THEN EXCLUDED."builtin_key"
    ELSE "cover_presets"."builtin_key"
  END;