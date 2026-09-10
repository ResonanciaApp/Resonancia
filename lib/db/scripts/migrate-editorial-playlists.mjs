import { readFile } from "node:fs/promises";
import pg from "pg";

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "Editorial playlist migrations are development-only; use the Publish schema flow for production",
  );
}
if (process.env.DB_MIGRATION_ENV !== "development") {
  throw new Error(
    "Refusing editorial playlist migration without DB_MIGRATION_ENV=development",
  );
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the editorial playlist migration");
}

const migrationFiles = [
  "0001_editorial_playlist_placements.sql",
  "0002_editorial_playlist_carousels.sql",
  "0003_editorial_playlist_home_fallback.sql",
];
const migrations = await Promise.all(
  migrationFiles.map((file) =>
    readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"),
  ),
);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  const { rows } = await client.query(`
    SELECT
      to_regclass('public.catalog_playlists') AS parent_table,
      to_regclass('public.catalog_playlist_placements') AS placement_table,
      to_regclass('public.catalog_playlist_carousels') AS carousel_table,
      to_regclass('public.catalog_playlist_carousel_migration_state') AS migration_state
  `);
  const schemaState = rows[0];
  let migrationCompleted = false;
  if (schemaState.migration_state) {
    const marker = await client.query(`
      SELECT EXISTS (
        SELECT 1
        FROM catalog_playlist_carousel_migration_state
        WHERE migration_key = 'legacy-playlist-placements-v1'
      ) AS completed
    `);
    migrationCompleted = marker.rows[0]?.completed === true;
  }
  if (!schemaState.parent_table && !schemaState.placement_table) {
    console.log(
      "Editorial playlist migration deferred: fresh database; Drizzle push will create the tables",
    );
  } else {
    if (!schemaState.parent_table && schemaState.placement_table) {
      throw new Error(
        "catalog_playlist_placements exists but catalog_playlists is missing",
      );
    }
    if (schemaState.carousel_table && !migrationCompleted) {
      const carouselCount = await client.query(
        "SELECT count(*)::integer AS count FROM catalog_playlist_carousels",
      );
      if (carouselCount.rows[0]?.count > 0) {
        // The new schema was pushed before this guarded migration ran and
        // already has editorial state. Treat it as authoritative; never
        // resurrect compatibility placement writes into an edited catalog.
        await client.query(`
          CREATE TABLE IF NOT EXISTS catalog_playlist_carousel_migration_state (
            migration_key text PRIMARY KEY,
            completed_at timestamptz NOT NULL DEFAULT now()
          );
          INSERT INTO catalog_playlist_carousel_migration_state (migration_key)
            VALUES ('legacy-playlist-placements-v1')
            ON CONFLICT (migration_key) DO NOTHING;
        `);
      }
    }
    for (const migration of migrations) {
      await client.query(migration);
    }
  }
} finally {
  await client.end();
}