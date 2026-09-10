import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import pg from "pg";

if (process.env.NODE_ENV === "production") {
  throw new Error(
    "Editorial playlist migration fixtures are development-only",
  );
}
if (process.env.DB_MIGRATION_ENV !== "development") {
  throw new Error(
    "Refusing editorial playlist migration fixture without DB_MIGRATION_ENV=development",
  );
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required for the editorial playlist fixture");
}

const migration2 = await readFile(
  new URL("../migrations/0002_editorial_playlist_carousels.sql", import.meta.url),
  "utf8",
);
const migration3 = await readFile(
  new URL(
    "../migrations/0003_editorial_playlist_home_fallback.sql",
    import.meta.url,
  ),
  "utf8",
);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
let fixtureSequence = 0;
const activeFixtures = new Set();

async function createFixtureSchema() {
  const schema = `editorial_migration_fixture_${process.pid}_${Date.now()}_${fixtureSequence++}`;
  const quotedSchema = `"${schema}"`;
  await client.query(`CREATE SCHEMA ${quotedSchema}`);
  activeFixtures.add(quotedSchema);
  await client.query(`SET search_path TO ${quotedSchema}`);
  await client.query(`
    CREATE TABLE catalog_playlists (
      id serial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      title text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      show_on_home boolean NOT NULL DEFAULT false,
      home_position integer,
      is_active boolean NOT NULL DEFAULT true
    );
    CREATE TABLE catalog_playlist_placements (
      id serial PRIMARY KEY,
      playlist_id integer NOT NULL REFERENCES catalog_playlists(id) ON DELETE CASCADE,
      surface text NOT NULL,
      sort_order integer NOT NULL DEFAULT 0,
      is_active boolean NOT NULL DEFAULT true
    );
  `);

  await client.query(`
    INSERT INTO catalog_playlists
      (id, slug, title, sort_order, show_on_home, home_position, is_active)
    VALUES
      (1, 'explicit-discover', 'Explicit Discover', 10, true, 1, true),
      (2, 'home-only', 'Home Only', 2, true, 2, true),
      (3, 'inactive-home', 'Inactive Home', 3, true, 3, false),
      (4, 'inactive-discover', 'Inactive Discover', 2, true, 4, true),
      (5, 'not-home', 'Not Home', 5, false, null, true),
      (6, 'sleep-and-home', 'Sleep And Home', 6, true, 6, true)
  `);
  await client.query(`
    INSERT INTO catalog_playlist_placements
      (playlist_id, surface, sort_order, is_active)
    VALUES
      (1, 'discover', 2, true),
      (4, 'discover', 4, false),
      (6, 'sleep', 0, true)
  `);
  return { schema, quotedSchema };
}

async function dropFixtureSchema({ quotedSchema }) {
  await client.query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`);
  activeFixtures.delete(quotedSchema);
}

async function queryRows(sql, values = []) {
  return (await client.query(sql, values)).rows;
}

async function assertCleanMigration() {
  const homeBefore = await queryRows(`
    SELECT id, show_on_home, home_position
    FROM catalog_playlists
    ORDER BY id
  `);
  await client.query(migration2);

  const carousels = await queryRows(`
    SELECT id, title, surface
    FROM catalog_playlist_carousels
    ORDER BY id
  `);
  assert.equal(carousels[0].id, 1, "fresh fixture should use carousel id 1");
  assert.deepEqual(
    carousels.map((row) => [row.title, row.surface]),
    [
      ["Playlists para ti", "discover"],
      ["Selecciones para dormir", "sleep"],
    ],
  );

  const memberships = await queryRows(`
    SELECT c.surface, m.playlist_id
    FROM catalog_playlist_carousel_memberships AS m
    JOIN catalog_playlist_carousels AS c ON c.id = m.carousel_id
    ORDER BY c.surface, m.sort_order
  `);
  assert.deepEqual(
    memberships.map((row) => [row.surface, row.playlist_id]),
    [
      // Equal effective order (2) follows the legacy catalog sortOrder/id:
      // playlist 2, playlist 4, then explicit playlist 1 (catalog sort 10).
      ["discover", 2],
      ["discover", 4],
      ["discover", 1],
      ["discover", 6],
      ["sleep", 6],
    ],
    "migration must materialize the old Discover fallback, including inactive placements",
  );

  const homeAfter = await queryRows(`
    SELECT id, show_on_home, home_position
    FROM catalog_playlists
    ORDER BY id
  `);
  assert.deepEqual(homeAfter, homeBefore, "migration must not rewrite Home fields");

  const firstCount = await queryRows(`
    SELECT
      (SELECT count(*) FROM catalog_playlist_carousels) AS carousels,
      (SELECT count(*) FROM catalog_playlist_carousel_memberships) AS memberships
  `);
  await client.query(migration2);
  const secondCount = await queryRows(`
    SELECT
      (SELECT count(*) FROM catalog_playlist_carousels) AS carousels,
      (SELECT count(*) FROM catalog_playlist_carousel_memberships) AS memberships
  `);
  assert.deepEqual(secondCount, firstCount, "clean migration must be idempotent");
}

async function assertCorrectiveMigration() {
  // Recreate the state produced by the first 0002 implementation: explicit
  // placements are present, but home-only fallback memberships are missing.
  await client.query(`
    DELETE FROM catalog_playlist_carousel_memberships
    WHERE playlist_id IN (2, 4, 6)
  `);
  await client.query(migration3);
  const corrected = await queryRows(`
    SELECT m.playlist_id
    FROM catalog_playlist_carousel_memberships AS m
    JOIN catalog_playlist_carousels AS c ON c.id = m.carousel_id
    WHERE c.surface = 'discover'
    ORDER BY m.sort_order
  `);
  assert.deepEqual(
    corrected.map((row) => row.playlist_id),
    [2, 4, 1, 6],
    "corrective migration must restore only missing effective fallback rows",
  );

  // A later rerun must not resurrect a membership removed by an admin.
  await client.query(`
    DELETE FROM catalog_playlist_carousel_memberships
    WHERE carousel_id = 1 AND playlist_id = 2
  `);
  await client.query(migration3);
  const rerun = await queryRows(`
    SELECT playlist_id
    FROM catalog_playlist_carousel_memberships
    WHERE carousel_id = 1
    ORDER BY sort_order
  `);
  assert.deepEqual(
    rerun.map((row) => row.playlist_id),
    [4, 1, 6],
    "corrective marker must prevent reactivating a removed membership",
  );
}

async function snapshotEditorialState() {
  return {
    carousels: await queryRows(`
      SELECT id, title, surface, sort_order, is_active, created_at, updated_at
      FROM catalog_playlist_carousels
      ORDER BY id
    `),
    memberships: await queryRows(`
      SELECT id, carousel_id, playlist_id, sort_order
      FROM catalog_playlist_carousel_memberships
      ORDER BY id
    `),
  };
}

async function assertCorrectiveDoesNotTouch(label, mutate) {
  const fixture = await createFixtureSchema();
  try {
    await client.query(migration2);
    await client.query(`
      DELETE FROM catalog_playlist_carousel_memberships
      WHERE playlist_id IN (2, 4, 6)
    `);
    await mutate();
    const before = await snapshotEditorialState();
    await client.query(migration3);
    const after = await snapshotEditorialState();
    assert.deepEqual(
      after,
      before,
      `${label}: corrective migration must not alter an edited/deleted default`,
    );
  } finally {
    await dropFixtureSchema(fixture);
  }
}

try {
  await client.connect();
  const cleanFixture = await createFixtureSchema();
  await assertCleanMigration();
  await assertCorrectiveMigration();
  await dropFixtureSchema(cleanFixture);

  await assertCorrectiveDoesNotTouch("deleted", async () => {
    await client.query("DELETE FROM catalog_playlist_carousels WHERE id = 1");
  });
  await assertCorrectiveDoesNotTouch("hidden", async () => {
    await client.query(
      "UPDATE catalog_playlist_carousels SET is_active = false WHERE id = 1",
    );
  });
  await assertCorrectiveDoesNotTouch("renamed", async () => {
    await client.query(
      "UPDATE catalog_playlist_carousels SET title = 'Edited title' WHERE id = 1",
    );
  });
  await assertCorrectiveDoesNotTouch("reordered", async () => {
    await client.query(
      "UPDATE catalog_playlist_carousels SET sort_order = 1 WHERE id = 1",
    );
  });
  await assertCorrectiveDoesNotTouch("member-edited", async () => {
    await client.query(`
      UPDATE catalog_playlist_carousel_memberships
      SET sort_order = 99
      WHERE carousel_id = 1 AND playlist_id = 1
    `);
  });
  await assertCorrectiveDoesNotTouch("timestamp-edited", async () => {
    await client.query(`
      UPDATE catalog_playlist_carousels
      SET updated_at = created_at + interval '1 second'
      WHERE id = 1
    `);
  });
  console.log("Editorial playlist migration fixture passed");
} finally {
  for (const quotedSchema of activeFixtures) {
    await client
      .query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`)
      .catch(() => {});
  }
  await client.end();
}