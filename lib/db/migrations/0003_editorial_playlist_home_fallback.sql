-- Corrective one-time migration for development databases that already ran
-- 0002 before the legacy Discover show_on_home fallback was materialized.
--
-- The marker is independent from the placement marker: existing development
-- databases can receive this correction exactly once, while reruns never
-- re-add memberships removed or changed by an administrator.
BEGIN;

CREATE TABLE IF NOT EXISTS catalog_playlist_carousel_migration_state (
  migration_key text PRIMARY KEY,
  completed_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE
  claimed integer;
  discover_id integer;
BEGIN
  INSERT INTO catalog_playlist_carousel_migration_state (migration_key)
    VALUES ('legacy-home-discover-fallback-v1')
    ON CONFLICT (migration_key) DO NOTHING;
  GET DIAGNOSTICS claimed = ROW_COUNT;

  IF claimed > 0 THEN
    -- Never create a carousel in a corrective migration. Only the exact
    -- untouched default produced by 0002 is eligible: its identity, active
    -- state, order, title, creation/update timestamps, and complete
    -- membership set must still match the old placement-only import.
    SELECT id INTO discover_id
    FROM catalog_playlist_carousels AS carousel
    WHERE carousel.surface = 'discover'
      AND carousel.title = 'Playlists para ti'
      AND carousel.sort_order = 0
      AND carousel.is_active = true
      AND carousel.created_at = carousel.updated_at
      AND (
        SELECT count(*)
        FROM catalog_playlist_carousel_memberships AS membership
        WHERE membership.carousel_id = carousel.id
      ) = (
        SELECT count(*)
        FROM catalog_playlist_placements AS placement
        INNER JOIN catalog_playlists AS playlist
          ON playlist.id = placement.playlist_id
        WHERE placement.surface = 'discover'
          AND placement.is_active = true
          AND playlist.is_active = true
      )
      AND NOT EXISTS (
        SELECT 1
        FROM catalog_playlist_carousel_memberships AS membership
        WHERE membership.carousel_id = carousel.id
          AND NOT EXISTS (
            SELECT 1
            FROM catalog_playlist_placements AS placement
            INNER JOIN catalog_playlists AS playlist
              ON playlist.id = placement.playlist_id
            WHERE placement.surface = 'discover'
              AND placement.is_active = true
              AND playlist.is_active = true
              AND placement.playlist_id = membership.playlist_id
              AND placement.sort_order = membership.sort_order
          )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM catalog_playlist_placements AS placement
        INNER JOIN catalog_playlists AS playlist
          ON playlist.id = placement.playlist_id
        WHERE placement.surface = 'discover'
          AND placement.is_active = true
          AND playlist.is_active = true
          AND NOT EXISTS (
            SELECT 1
            FROM catalog_playlist_carousel_memberships AS membership
            WHERE membership.carousel_id = carousel.id
              AND membership.playlist_id = placement.playlist_id
              AND membership.sort_order = placement.sort_order
          )
      )
    ORDER BY carousel.id
    LIMIT 1;

    IF discover_id IS NOT NULL THEN
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
          AND NOT EXISTS (
            SELECT 1
            FROM catalog_playlist_carousel_memberships AS membership
            WHERE membership.carousel_id = discover_id
              AND membership.playlist_id = playlist.id
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
  END IF;
END
$$;

COMMIT;