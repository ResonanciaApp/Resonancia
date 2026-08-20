import type { Request, RequestHandler } from "express";
import { pool, databasePoolMax } from "@workspace/db";
import { logger } from "./logger";

type Observation = {
  method: string;
  route: string;
  statusCode: number;
  durationMs: number;
  responseBytes: number;
};

type RecentSample = {
  durationMs: number;
  failed: boolean;
};

type MetricBucket = {
  method: string;
  route: string;
  count: number;
  errors: number;
  durationTotalMs: number;
  durationMaxMs: number;
  responseBytes: number;
  statusCodes: Map<number, number>;
  recent: RecentSample[];
  lastAlertAt: number;
};

const MAX_ROUTE_BUCKETS = 100;
const MAX_RECENT_SAMPLES = 512;
const OVERFLOW_BUCKET_KEY = "* __other__";
const metrics = new Map<string, MetricBucket>();
let startedAt = Date.now();

function boundedNumber(
  name: string,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value >= minimum && value <= maximum
    ? value
    : fallback;
}

const alertP95Ms = boundedNumber("CAPACITY_ALERT_P95_MS", 1_000, 50, 60_000);
const alertErrorRate = boundedNumber("CAPACITY_ALERT_ERROR_RATE", 0.05, 0, 1);
const alertMinSamples = boundedNumber("CAPACITY_ALERT_MIN_SAMPLES", 20, 5, 10_000);
const alertCooldownMs = boundedNumber("CAPACITY_ALERT_COOLDOWN_MS", 60_000, 1_000, 3_600_000);

function percentile(values: number[], quantile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1);
  return Math.round(sorted[Math.max(0, index)] * 100) / 100;
}

export function normalizeCapacityRoute(req: Pick<Request, "baseUrl" | "path" | "route">): string {
  const routePath = (req.route as { path?: unknown } | undefined)?.path;
  if (typeof routePath === "string") {
    return `${req.baseUrl}${routePath}` || "/";
  }
  return "/__unmatched__";
}

function getOrCreateBucket(method: string, route: string): MetricBucket {
  const key = `${method} ${route}`;
  const existing = metrics.get(key);
  if (existing) return existing;

  // Reserve one global overflow bucket, so untrusted unmatched paths and unusual
  // methods cannot grow this in-memory map beyond the advertised limit.
  if (metrics.size >= MAX_ROUTE_BUCKETS - 1) {
    const overflow = metrics.get(OVERFLOW_BUCKET_KEY);
    if (overflow) return overflow;
    const fallback: MetricBucket = {
      method: "*",
      route: "__other__",
      count: 0,
      errors: 0,
      durationTotalMs: 0,
      durationMaxMs: 0,
      responseBytes: 0,
      statusCodes: new Map(),
      recent: [],
      lastAlertAt: 0,
    };
    metrics.set(OVERFLOW_BUCKET_KEY, fallback);
    return fallback;
  }

  const bucket: MetricBucket = {
    method,
    route,
    count: 0,
    errors: 0,
    durationTotalMs: 0,
    durationMaxMs: 0,
    responseBytes: 0,
    statusCodes: new Map(),
    recent: [],
    lastAlertAt: 0,
  };
  metrics.set(key, bucket);
  return bucket;
}

export function recordCapacityObservation(observation: Observation): void {
  const bucket = getOrCreateBucket(observation.method, observation.route);
  const failed = observation.statusCode >= 500;
  bucket.count += 1;
  bucket.errors += failed ? 1 : 0;
  bucket.durationTotalMs += observation.durationMs;
  bucket.durationMaxMs = Math.max(bucket.durationMaxMs, observation.durationMs);
  bucket.responseBytes += observation.responseBytes;
  bucket.statusCodes.set(
    observation.statusCode,
    (bucket.statusCodes.get(observation.statusCode) ?? 0) + 1,
  );
  bucket.recent.push({ durationMs: observation.durationMs, failed });
  if (bucket.recent.length > MAX_RECENT_SAMPLES) bucket.recent.shift();

  if (bucket.recent.length < alertMinSamples || bucket.count % alertMinSamples !== 0) return;

  const durations = bucket.recent.map((sample) => sample.durationMs);
  const p95Ms = percentile(durations, 0.95);
  const errorRate =
    bucket.recent.filter((sample) => sample.failed).length / bucket.recent.length;
  const now = Date.now();
  const poolWaiting = pool.waitingCount;
  if (
    now - bucket.lastAlertAt >= alertCooldownMs &&
    (p95Ms > alertP95Ms || errorRate > alertErrorRate || poolWaiting > 0)
  ) {
    bucket.lastAlertAt = now;
    logger.warn(
      {
        event: "capacity_threshold_exceeded",
        method: bucket.method,
        route: bucket.route,
        samples: bucket.recent.length,
        p95Ms,
        errorRate,
        poolWaiting,
        thresholds: { p95Ms: alertP95Ms, errorRate: alertErrorRate },
      },
      "Capacity threshold exceeded",
    );
  }
}

export function getCapacityMetricsSnapshot() {
  const routes = [...metrics.values()]
    .map((bucket) => {
      const durations = bucket.recent.map((sample) => sample.durationMs);
      const recentErrors = bucket.recent.filter((sample) => sample.failed).length;
      return {
        method: bucket.method,
        route: bucket.route,
        count: bucket.count,
        errors: bucket.errors,
        recentSamples: bucket.recent.length,
        recentErrorRate:
          bucket.recent.length === 0 ? 0 : recentErrors / bucket.recent.length,
        latencyMs: {
          average:
            bucket.count === 0
              ? 0
              : Math.round((bucket.durationTotalMs / bucket.count) * 100) / 100,
          p50: percentile(durations, 0.5),
          p95: percentile(durations, 0.95),
          p99: percentile(durations, 0.99),
          max: Math.round(bucket.durationMaxMs * 100) / 100,
        },
        responseBytes: bucket.responseBytes,
        statusCodes: Object.fromEntries(
          [...bucket.statusCodes.entries()].sort(([a], [b]) => a - b),
        ),
      };
    })
    .sort((a, b) => b.count - a.count);

  return {
    startedAt: new Date(startedAt).toISOString(),
    generatedAt: new Date().toISOString(),
    thresholds: {
      p95Ms: alertP95Ms,
      errorRate: alertErrorRate,
      minimumSamples: alertMinSamples,
    },
    pool: {
      configuredMax: databasePoolMax,
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount,
    },
    routes,
  };
}

export function capacityMetricsMiddleware(): RequestHandler {
  return (req, res, next) => {
    const started = process.hrtime.bigint();
    res.once("finish", () => {
      const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
      const contentLength = Number(res.getHeader("content-length"));
      recordCapacityObservation({
        method: req.method,
        route: normalizeCapacityRoute(req),
        statusCode: res.statusCode,
        durationMs,
        responseBytes: Number.isFinite(contentLength) ? contentLength : 0,
      });
    });
    next();
  };
}

export function resetCapacityMetricsForTests(): void {
  metrics.clear();
  startedAt = Date.now();
}