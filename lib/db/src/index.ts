import { drizzle } from "drizzle-orm/node-postgres";
import pg, { type PoolConfig } from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

function readPoolInteger(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

const databasePoolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: readPoolInteger("DATABASE_POOL_MAX", 10, 1, 100),
  idleTimeoutMillis: readPoolInteger("DATABASE_POOL_IDLE_TIMEOUT_MS", 10_000, 1_000, 300_000),
  connectionTimeoutMillis: readPoolInteger(
    "DATABASE_POOL_CONNECTION_TIMEOUT_MS",
    5_000,
    250,
    60_000,
  ),
  keepAlive: true,
  application_name: process.env.PGAPPNAME ?? "resonancia-api",
};

export const databasePoolMax = databasePoolConfig.max ?? 10;
export const pool = new Pool(databasePoolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
