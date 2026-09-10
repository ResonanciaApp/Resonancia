-- Required editorial classification for every public playlist.
-- Existing playlists intentionally default to Meditativa.
BEGIN;

DO $$
BEGIN
  CREATE TYPE editorial_playlist_type AS ENUM ('meditative', 'relaxation', 'ritual');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE catalog_playlists
  ADD COLUMN IF NOT EXISTS editorial_type editorial_playlist_type
    NOT NULL DEFAULT 'meditative';

UPDATE catalog_playlists
SET editorial_type = 'meditative'
WHERE editorial_type IS NULL;

-- Backfill the duration pill for legacy playlists that had no editorial
-- duration. `duration` is stored in minutes, so keep the label compact and
-- consistent with the client: "31 min" or "2 h 16 min".  Only blank labels
-- are touched, making this safe to re-run and preserving any curated label.
WITH playlist_durations AS (
  SELECT
    playlist.id,
    SUM(catalog_session.duration)::integer AS total_minutes
  FROM catalog_playlists AS playlist
  CROSS JOIN LATERAL unnest(playlist.session_ids) AS session_id(value)
  INNER JOIN catalog_sessions AS catalog_session
    ON catalog_session.id = session_id.value
  GROUP BY playlist.id
)
UPDATE catalog_playlists AS playlist
SET duration_label = CASE
  WHEN durations.total_minutes >= 60 THEN
    (durations.total_minutes / 60)::text || ' h' ||
    CASE
      WHEN durations.total_minutes % 60 > 0
        THEN ' ' || (durations.total_minutes % 60)::text || ' min'
      ELSE ''
    END
  ELSE durations.total_minutes::text || ' min'
END
FROM playlist_durations AS durations
WHERE playlist.id = durations.id
  AND btrim(playlist.duration_label) = ''
  AND durations.total_minutes > 0;

COMMIT;