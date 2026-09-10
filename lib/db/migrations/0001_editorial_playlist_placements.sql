-- Editorial playlist placements.
--
-- This migration is intentionally idempotent and is run by the development
-- post-merge hook. Production schema changes still flow through Publish.
BEGIN;

CREATE TABLE IF NOT EXISTS catalog_playlist_placements (
  id serial PRIMARY KEY,
  playlist_id integer NOT NULL
    REFERENCES catalog_playlists(id) ON DELETE CASCADE,
  surface text NOT NULL
    CHECK (surface IN ('discover', 'sleep')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_playlist_placements_playlist_surface_unique
    UNIQUE (playlist_id, surface),
  CONSTRAINT catalog_playlist_placements_surface_order_unique
    UNIQUE (surface, sort_order)
);

CREATE UNIQUE INDEX IF NOT EXISTS
  catalog_playlist_placements_playlist_surface_unique
  ON catalog_playlist_placements (playlist_id, surface);

CREATE INDEX IF NOT EXISTS
  catalog_playlist_placements_surface_active_order_idx
  ON catalog_playlist_placements (surface, is_active, sort_order);

-- A pre-existing table may have been created before the global surface/order
-- invariant was introduced. Normalize its positions before adding the unique
-- index. The guard makes subsequent runs no-ops even when the index exists.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'catalog_playlist_placements_surface_order_unique'
  ) THEN
    WITH ranked AS (
      SELECT
        id,
        row_number() OVER (
          PARTITION BY surface
          ORDER BY sort_order, id
        ) - 1 AS normalized_sort_order
      FROM catalog_playlist_placements
    )
    UPDATE catalog_playlist_placements AS placement
    SET sort_order = ranked.normalized_sort_order
    FROM ranked
    WHERE placement.id = ranked.id
      AND placement.sort_order <> ranked.normalized_sort_order;

    CREATE UNIQUE INDEX catalog_playlist_placements_surface_order_unique
      ON catalog_playlist_placements (surface, sort_order);
  END IF;
END
$$;

COMMIT;