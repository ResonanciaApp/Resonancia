import { readFile } from "node:fs/promises";
import pg from "pg";

if (process.env.NODE_ENV === "production" || process.env.DB_MIGRATION_ENV !== "development") {
  throw new Error("This migration requires DB_MIGRATION_ENV=development; use Publish for production schema changes");
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const migration = await readFile(
  new URL("../migrations/0027_featured_moment.sql", import.meta.url), "utf8",
);
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext('featured_moment_schema'))");
  await client.query(migration);
  await client.query("COMMIT");
  console.log("Daily featured-moment schema is ready (development only).");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}