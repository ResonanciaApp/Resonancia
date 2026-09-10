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

const migration = await readFile(
  new URL("../migrations/0001_editorial_playlist_placements.sql", import.meta.url),
  "utf8",
);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  const { rows } = await client.query(`
    SELECT
      to_regclass('public.catalog_playlists') AS parent_table,
      to_regclass('public.catalog_playlist_placements') AS placement_table
  `);
  const schemaState = rows[0];
  if (!schemaState.parent_table && !schemaState.placement_table) {
    console.log(
      "Editorial playlist migration deferred: fresh database; Drizzle push will create the new table",
    );
  } else {
    if (!schemaState.parent_table && schemaState.placement_table) {
      throw new Error(
        "catalog_playlist_placements exists but catalog_playlists is missing",
      );
    }
    await client.query(migration);
  }
} finally {
  await client.end();
}