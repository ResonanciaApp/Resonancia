import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

function integerEnv(name, fallback, minimum, maximum) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

const analyze = process.env.CAPACITY_DB_EXPLAIN_ANALYZE === "YES";
const timeoutMs = integerEnv("CAPACITY_DB_STATEMENT_TIMEOUT_MS", 10_000, 100, 120_000);
const explainPrefix = analyze
  ? "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)"
  : "EXPLAIN (FORMAT JSON)";

const planQueries = [
  {
    name: "popular_sessions",
    sql: `
      SELECT session_id, count(*)::bigint AS plays
      FROM playback_history
      GROUP BY session_id
      ORDER BY count(*) DESC
      LIMIT 10
    `,
  },
  {
    name: "mix_feed",
    sql: `
      SELECT id, author_id, likes, created_at
      FROM shared_mixes
      WHERE hidden = false
      ORDER BY likes DESC, created_at DESC
      LIMIT 20
    `,
  },
  {
    name: "community_feed",
    sql: `
      SELECT id, user_id, event_type, created_at
      FROM community_activity_events
      WHERE created_at >= now() - interval '24 hours'
      ORDER BY created_at DESC
      LIMIT 50
    `,
  },
  {
    name: "favorites_by_user",
    sql: `
      SELECT session_id, created_at
      FROM favorites
      WHERE user_id = (SELECT id FROM users ORDER BY id LIMIT 1)
      ORDER BY created_at DESC
    `,
  },
  {
    name: "direct_message_thread",
    sql: `
      SELECT id, sender_id, recipient_id, created_at
      FROM direct_messages
      WHERE (
        sender_id = (SELECT id FROM users ORDER BY id LIMIT 1)
        OR recipient_id = (SELECT id FROM users ORDER BY id LIMIT 1)
      )
      ORDER BY created_at DESC
      LIMIT 50
    `,
  },
];

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  application_name: "resonancia-capacity-report",
  connectionTimeoutMillis: 5_000,
});

await client.connect();

let report;
try {
  await client.query("BEGIN READ ONLY");
  await client.query(`SET LOCAL statement_timeout = ${timeoutMs}`);

  const databaseSize = await client.query(`
    SELECT current_database() AS database_name,
           pg_database_size(current_database())::bigint AS size_bytes
  `);
  const databaseStats = await client.query(`
    SELECT numbackends, xact_commit, xact_rollback, blks_read, blks_hit,
           tup_returned, tup_fetched, tup_inserted, tup_updated, tup_deleted,
           deadlocks, temp_files, temp_bytes
    FROM pg_stat_database
    WHERE datname = current_database()
  `);
  const activityStats = await client.query(`
    SELECT coalesce(state, 'unknown') AS state,
           coalesce(wait_event_type, 'none') AS wait_event_type,
           count(*)::integer AS connections
    FROM pg_stat_activity
    WHERE datname = current_database()
    GROUP BY state, wait_event_type
    ORDER BY connections DESC
  `);
  const tableStats = await client.query(`
    SELECT relname AS table_name, n_live_tup, n_dead_tup, seq_scan, idx_scan,
           pg_total_relation_size(relid)::bigint AS total_size_bytes
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
  `);
  const indexStats = await client.query(`
    SELECT relname AS table_name, indexrelname AS index_name, idx_scan,
           pg_relation_size(indexrelid)::bigint AS index_size_bytes
    FROM pg_stat_user_indexes
    ORDER BY pg_relation_size(indexrelid) DESC
  `);

  const plans = [];
  for (const query of planQueries) {
    const result = await client.query(`${explainPrefix} ${query.sql}`);
    plans.push({
      name: query.name,
      plan: result.rows[0]?.["QUERY PLAN"] ?? null,
    });
  }

  report = {
    version: 1,
    generatedAt: new Date().toISOString(),
    explainAnalyze: analyze,
    statementTimeoutMs: timeoutMs,
    database: databaseSize.rows[0],
    databaseStats: databaseStats.rows[0],
    connectionActivity: activityStats.rows,
    tables: tableStats.rows,
    indexes: indexStats.rows,
    plans,
  };
  await client.query("ROLLBACK");
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  throw error;
} finally {
  await client.end();
}

console.log(JSON.stringify(report, null, 2));

const reportPath = process.env.CAPACITY_DB_REPORT_PATH;
if (reportPath) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Database capacity report written to ${reportPath}`);
}