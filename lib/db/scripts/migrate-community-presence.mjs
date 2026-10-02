import { readFile } from "node:fs/promises";
import pg from "pg";

if (process.env.NODE_ENV === "production" || process.env.DB_MIGRATION_ENV !== "development") {
  throw new Error("Requires DB_MIGRATION_ENV=development; use Publish for production schema changes");
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext('community_presence_schema'))");
  await client.query(await readFile(new URL("../migrations/0028_community_presence.sql", import.meta.url), "utf8"));
  await client.query("COMMIT");
  console.log("Community presence schema ready (development).");
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  throw error;
} finally {
  await client.end();
}