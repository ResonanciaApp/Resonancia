-- Editorial playlist carousels and ordered memberships.
--
-- This migration is intentionally idempotent and development-only.  It runs
-- after 0001, before Drizzle schema push, so an existing development catalog
-- can be converted without allowing the old per-playlist placement rows to
-- become a runtime fallback.
BEGIN;

CREATE TABLE IF NOT EXISTS catalog_playlist_carousels (
  id serial PRIMARY KEY,
  title text NOT NULL,
  surface text NOT NULL
    CHECK (surface IN ('discover', 'sleep')),
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_playlist_carousels_surface_order_unique
    UNIQUE (surface, sort_order)
);

CREATE INDEX IF NOT EXISTS
  catalog_playlist_carousels_surface_active_order_idx
  ON catalog_playlist_carousels (surface, is_active, sort_order);

CREATE TABLE IF NOT EXISTS catalog_playlist_carousel_memberships (
  id serial PRIMARY KEY,
  carousel_id integer NOT NULL
    REFERENCES catalog_playlist_carousels(id) ON DELETE CASCADE,
  playlist_id integer NOT NULL
    REFERENCES catalog_playlists(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT catalog_playlist_carousel_memberships_carousel_playlist_unique
    UNIQUE (carousel_id, playlist_id),
  CONSTRAINT catalog_playlist_carousel_memberships_carousel_order_unique
    UNIQUE (carousel_id, sort_order)
);

CREATE INDEX IF NOT EXISTS
  catalog_playlist_carousel_memberships_carousel_order_idx
  ON catalog_playlist_carousel_memberships (carousel_id, sort_order);

-- The marker prevents a later rerun from importing newly-written legacy
-- placement rows, which are deliberately not a fallback for carousel state.
CREATE TABLE IF NOT EXISTS catalog_playlist_carousel_migration_state (
  migration_key text PRIMARY KEY,
  completed_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  claimed integer;
  discover_id integer;
  sleep_id integer;
BEGIN
  INSERT INTO catalog_playlist_carousel_migration_state (migration_key)
    VALUES ('legacy-playlist-placements-v1')
    ON CONFLICT (migration_key) DO NOTHING;
  GET DIAGNOSTICS claimed = ROW_COUNT;

  IF claimed > 0 THEN
    -- Keep the labels that the previous fixed carousels exposed in the app.
    -- If a surface already has a carousel (for example, a partially migrated
    -- development database), leave that editorial choice untouched.
    INSERT INTO catalog_playlist_carousels (title, surface, sort_order, is_active)
      SELECT 'Playlists para ti', 'discover', 0, true
      WHERE NOT EXISTS (
        SELECT 1 FROM catalog_playlist_carousels WHERE surface = 'discover'
      )
      RETURNING id INTO discover_id;

    INSERT INTO catalog_playlist_carousels (title, surface, sort_order, is_active)
      SELECT 'Selecciones para dormir', 'sleep', 0, true
      WHERE NOT EXISTS (
        SELECT 1 FROM catalog_playlist_carousels WHERE surface = 'sleep'
      )
      RETURNING id INTO sleep_id;

    SELECT id INTO discover_id
      FROM catalog_playlist_carousels
      WHERE surface = 'discover'
      ORDER BY sort_order, id
      LIMIT 1;
    SELECT id INTO sleep_id
      FROM catalog_playlist_carousels
      WHERE surface = 'sleep'
      ORDER BY sort_order, id
      LIMIT 1;

    -- Import only effective public placement content.  Inactive placements
    -- and inactive playlists remain represented by their legacy rows but do
    -- not silently publish into the new state.
    INSERT INTO catalog_playlist_carousel_memberships
      (carousel_id, playlist_id, sort_order)
    SELECT
      CASE placement.surface
        WHEN 'discover' THEN discover_id
        WHEN 'sleep' THEN sleep_id
      END,
      placement.playlist_id,
      placement.sort_order
    FROM catalog_playlist_placements AS placement
    INNER JOIN catalog_playlists AS playlist
      ON playlist.id = placement.playlist_id
    WHERE placement.is_active = true
      AND playlist.is_active = true
    ON CONFLICT (carousel_id, playlist_id) DO NOTHING;

    -- Before carousels were introduced, Discover also used an implicit
    -- fallback: an active show_on_home playlist with no active Discover
    -- placement was visible there. Materialize that effective content only
    -- during this one-time conversion. Existing memberships move to
    -- temporary negative orders to avoid collisions; the final pass restores
    -- the legacy sort order and makes the new membership order contiguous.
    CREATE TEMP TABLE editorial_carousel_existing_order (
      id integer PRIMARY KEY,
      sort_order integer NOT NULL
    ) ON COMMIT DROP;
    INSERT INTO editorial_carousel_existing_order (id, sort_order)
    SELECT membership.id, membership.sort_order
    FROM catalog_playlist_carousel_memberships AS membership
    WHERE membership.carousel_id = discover_id;
    UPDATE catalog_playlist_carousel_memberships AS membership
    SET sort_order = -2000000000 + membership.id
    WHERE membership.carousel_id = discover_id;

    CREATE TEMP TABLE editorial_carousel_new_order (
      id integer PRIMARY KEY,
      sort_order integer NOT NULL
    ) ON COMMIT DROP;
    WITH inserted AS (
      INSERT INTO catalog_playlist_carousel_memberships
        (carousel_id, playlist_id, sort_order)
      SELECT
        discover_id,
        playlist.id,
        -1000000000 - playlist.id
      FROM catalog_playlists AS playlist
      WHERE playlist.is_active = true
        AND playlist.show_on_home = true
        AND NOT EXISTS (
          SELECT 1
          FROM catalog_playlist_placements AS placement
          WHERE placement.playlist_id = playlist.id
            AND placement.surface = 'discover'
            AND placement.is_active = true
        )
      ON CONFLICT (carousel_id, playlist_id) DO NOTHING
      RETURNING id, playlist_id
    )
    INSERT INTO editorial_carousel_new_order (id, sort_order)
    SELECT inserted.id, playlist.sort_order
    FROM inserted
    INNER JOIN catalog_playlists AS playlist
      ON playlist.id = inserted.playlist_id;

    CREATE TEMP TABLE editorial_carousel_membership_order (
      id integer PRIMARY KEY,
      sort_order integer NOT NULL
    ) ON COMMIT DROP;
    INSERT INTO editorial_carousel_membership_order (id, sort_order)
    SELECT
      membership.id,
      row_number() OVER (
        -- Match the legacy catalog's sortOrder, then playlist id tie-break.
        ORDER BY
          COALESCE(existing.sort_order, created.sort_order, membership.sort_order),
          playlist.sort_order,
          playlist.id,
          membership.id
      ) - 1
    FROM catalog_playlist_carousel_memberships AS membership
    INNER JOIN catalog_playlists AS playlist
      ON playlist.id = membership.playlist_id
    LEFT JOIN editorial_carousel_existing_order AS existing
      ON existing.id = membership.id
    LEFT JOIN editorial_carousel_new_order AS created
      ON created.id = membership.id
    WHERE membership.carousel_id = discover_id;
    UPDATE catalog_playlist_carousel_memberships AS membership
    SET sort_order = -membership.id
    WHERE membership.carousel_id = discover_id;
    UPDATE catalog_playlist_carousel_memberships AS membership
    SET sort_order = ranked.sort_order
    FROM editorial_carousel_membership_order AS ranked
    WHERE membership.id = ranked.id;
  END IF;
END
$$;

COMMIT;