import { pool, db, growthCatalogTable } from "@workspace/db";
import { growthSeed } from "./growthSeed";

// Additive, repeatable migration. Never run drizzle push-force for this feature.
export async function initializeGrowthSchema() {
  const client = await pool.connect();
  try {
    await client.query(`BEGIN;
      SELECT pg_advisory_xact_lock(hashtext('resonancia-growth-schema'));
      CREATE TABLE IF NOT EXISTS growth_catalog (
        id text PRIMARY KEY, revision integer NOT NULL DEFAULT 1,
        stages jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE IF NOT EXISTS growth_wallets (
        user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        max_days integer NOT NULL DEFAULT 0 CHECK (max_days >= 0),
        reached jsonb NOT NULL DEFAULT '[]'::jsonb
      );
      CREATE TABLE IF NOT EXISTS growth_grants (
        user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reward_id text NOT NULL, stage_id text NOT NULL,
        amount integer NOT NULL CHECK (amount > 0),
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY(user_id,reward_id)
      );
      CREATE TABLE IF NOT EXISTS growth_avatar_unlocks (
        user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        avatar_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY(user_id,avatar_id)
      );
      COMMIT;`);
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
  // The singleton row is the initialization marker, including a deliberately empty catalog.
  await db.insert(growthCatalogTable).values({ id: "main", stages: growthSeed }).onConflictDoNothing();
}
