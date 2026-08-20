import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { getCapacityMetricsSnapshot } from "../lib/capacityMetrics";

const router: IRouter = Router();
const READINESS_CACHE_MS = 5_000;
let readinessCache: { checkedAt: number; databaseOk: boolean } | undefined;
let readinessInFlight: Promise<boolean> | undefined;

async function databaseIsReady(): Promise<boolean> {
  const now = Date.now();
  if (readinessCache && now - readinessCache.checkedAt < READINESS_CACHE_MS) {
    return readinessCache.databaseOk;
  }
  if (readinessInFlight) return readinessInFlight;

  readinessInFlight = (async () => {
    try {
      await pool.query("select 1");
      readinessCache = { checkedAt: Date.now(), databaseOk: true };
      return true;
    } catch {
      readinessCache = { checkedAt: Date.now(), databaseOk: false };
      return false;
    } finally {
      readinessInFlight = undefined;
    }
  })();
  return readinessInFlight;
}

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.setHeader("Cache-Control", "no-store");
  res.json(data);
});

router.get("/readyz", async (_req, res) => {
  const databaseOk = await databaseIsReady();
  res.setHeader("Cache-Control", "no-store");
  res.status(databaseOk ? 200 : 503).json({
    status: databaseOk ? "ready" : "degraded",
    database: databaseOk ? "ok" : "unavailable",
  });
});

router.get(
  "/admin/capacity/metrics",
  requireAuth,
  requireRole("admin"),
  (_req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json(getCapacityMetricsSnapshot());
  },
);

export default router;
