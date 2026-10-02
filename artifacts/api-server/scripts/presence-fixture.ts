import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { pool } from "@workspace/db";
import { loadSummary } from "../src/routes/community-presence";

if (process.env.DB_MIGRATION_ENV !== "development" || process.env.NODE_ENV === "production") {
  throw new Error("Presence fixtures may run only on the development database");
}
const client = await pool.connect();
const marker = `presence-fixture-${randomUUID()}`;
try {
  await client.query("BEGIN");
  const baseline = (await loadSummary(client)).count;
  const users: number[] = [];
  for (let i = 0; i < 3; i++) {
    const result = await client.query(`INSERT INTO users(clerk_user_id,username,display_name)
      VALUES($1,$1,'Presence fixture') RETURNING id`, [`${marker}-${i}`]);
    users.push(result.rows[0].id);
  }
  const a = randomUUID(), b = randomUUID(), expired = randomUUID(), other = randomUUID();
  await client.query(`INSERT INTO community_presence(user_id,session_id,last_seen_at,closed_at) VALUES
    ($1,$4,now(),NULL),($1,$5,now(),NULL),
    ($2,$6,now()-interval '91 seconds',NULL),($3,$7,now(),NULL)`, [...users, a, b, expired, other]);
  assert.equal((await loadSummary(client)).count, baseline + 2, "devices deduplicate and expired leases do not count");
  await client.query("UPDATE community_presence SET closed_at=now() WHERE user_id=$1 AND session_id=$2", [users[0], a]);
  assert.equal((await loadSummary(client)).count, baseline + 2, "another device remains connected");
  await client.query("UPDATE community_presence SET closed_at=now() WHERE user_id=$1 AND session_id=$2", [users[0], b]);
  assert.equal((await loadSummary(client)).count, baseline + 1, "last device leaving removes the account");
  await client.query(`INSERT INTO community_presence(user_id,session_id) VALUES($1,$2)
    ON CONFLICT(user_id,session_id) DO UPDATE SET last_seen_at=now()
    WHERE community_presence.closed_at IS NULL`, [users[0], a]);
  assert.equal((await loadSummary(client)).count, baseline + 1, "late heartbeat cannot revive a closed device");
  await client.query("DELETE FROM users WHERE id=$1", [users[2]]);
  assert.equal((await loadSummary(client)).count, baseline, "account deletion cascades presence");
  await client.query("ROLLBACK");
  const clean = await client.query("SELECT count(*)::integer AS count FROM users WHERE clerk_user_id LIKE $1", [`${marker}%`]);
  assert.equal(clean.rows[0].count, 0, "all fixture accounts were rolled back");
  console.log("Presence PostgreSQL fixtures passed; all test accounts rolled back.");
} catch (error) {
  await client.query("ROLLBACK"); throw error;
} finally {
  client.release();
  await pool.end();
}