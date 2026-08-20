import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { performance } from "node:perf_hooks";

const profiles = {
  smoke: { concurrency: 5, targetRps: 10, durationSeconds: 15 },
  launch: { concurrency: 100, targetRps: 50, durationSeconds: 120 },
};

function integerEnv(name, fallback, minimum, maximum) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be an integer between ${minimum} and ${maximum}`);
  }
  return value;
}

function numberEnv(name, fallback, minimum, maximum) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new Error(`${name} must be between ${minimum} and ${maximum}`);
  }
  return value;
}

function percentile(values, quantile) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * quantile) - 1);
  return Math.round(sorted[Math.max(0, index)] * 100) / 100;
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function weightedPool(scenarios) {
  return scenarios.flatMap((scenario) =>
    Array.from({ length: scenario.weight ?? 1 }, () => scenario),
  );
}

function summarize(name, results) {
  const durations = results.map((result) => result.durationMs);
  const failed = results.filter((result) => !result.ok);
  return {
    name,
    requests: results.length,
    errors: failed.length,
    errorRate: results.length === 0 ? 0 : failed.length / results.length,
    throughputRps: 0,
    latencyMs: {
      p50: percentile(durations, 0.5),
      p95: percentile(durations, 0.95),
      p99: percentile(durations, 0.99),
      max: durations.length === 0 ? 0 : Math.round(Math.max(...durations) * 100) / 100,
    },
    statusCodes: results.reduce((counts, result) => {
      const key = result.statusCode === 0 ? "network_error" : String(result.statusCode);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {}),
    responseBytes: results.reduce((total, result) => total + result.responseBytes, 0),
  };
}

const profileName = process.env.CAPACITY_PROFILE ?? "smoke";
const profile = profiles[profileName];
if (!profile) {
  throw new Error(`CAPACITY_PROFILE must be one of: ${Object.keys(profiles).join(", ")}`);
}

const baseUrlRaw = process.env.CAPACITY_BASE_URL;
if (!baseUrlRaw) throw new Error("CAPACITY_BASE_URL is required");
const baseUrl = new URL(baseUrlRaw);
const localHost = ["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname);
const replitDevelopmentHost = baseUrl.hostname.endsWith(".replit.dev");
if (
  !localHost &&
  replitDevelopmentHost &&
  process.env.CAPACITY_ALLOW_REMOTE !== "YES"
) {
  throw new Error(
    "Refusing to load-test a remote development host without CAPACITY_ALLOW_REMOTE=YES.",
  );
}
if (
  !localHost &&
  !replitDevelopmentHost &&
  process.env.CAPACITY_ALLOW_PRODUCTION !== "YES"
) {
  throw new Error(
    "Refusing to load-test a remote/production host. Set CAPACITY_ALLOW_PRODUCTION=YES only after explicit approval.",
  );
}

const concurrency = integerEnv("CAPACITY_CONCURRENCY", profile.concurrency, 1, 1_000);
const targetRps = numberEnv("CAPACITY_TARGET_RPS", profile.targetRps, 0.1, 10_000);
const durationSeconds = integerEnv(
  "CAPACITY_DURATION_SECONDS",
  profile.durationSeconds,
  1,
  3_600,
);
const requestTimeoutMs = integerEnv("CAPACITY_REQUEST_TIMEOUT_MS", 10_000, 100, 120_000);
const targetP95Ms = numberEnv("CAPACITY_TARGET_P95_MS", 750, 10, 120_000);
const targetErrorRate = numberEnv("CAPACITY_TARGET_ERROR_RATE", 0.01, 0, 1);
const throughputTolerance = numberEnv(
  "CAPACITY_THROUGHPUT_TOLERANCE",
  0.05,
  0,
  0.5,
);
const minimumThroughputRps = targetRps * (1 - throughputTolerance);

const authHeaders = {};
if (process.env.CAPACITY_AUTHORIZATION) {
  authHeaders.Authorization = process.env.CAPACITY_AUTHORIZATION;
}
if (process.env.CAPACITY_AUTH_COOKIE) {
  authHeaders.Cookie = process.env.CAPACITY_AUTH_COOKIE;
}
const hasAuth = Object.keys(authHeaders).length > 0;
const scenarioSet = process.env.CAPACITY_SCENARIO_SET ?? "mixed";
if (!["public", "authenticated", "mixed"].includes(scenarioSet)) {
  throw new Error("CAPACITY_SCENARIO_SET must be public, authenticated, or mixed");
}
if (scenarioSet === "authenticated" && !hasAuth) {
  throw new Error("CAPACITY_SCENARIO_SET=authenticated requires an auth header or cookie");
}

const scenarios = [];
if (scenarioSet !== "authenticated") {
  scenarios.push(
    { name: "catalog", method: "GET", path: "/api/catalog", weight: 3 },
    { name: "popular", method: "GET", path: "/api/catalog/popular?limit=10", weight: 2 },
    { name: "mixes", method: "GET", path: "/api/mixes?page=1", weight: 2 },
    { name: "community", method: "GET", path: "/api/community/feed", weight: 2 },
    { name: "messages", method: "GET", path: "/api/messages?page=1", weight: 1 },
    { name: "ready", method: "GET", path: "/api/readyz", weight: 1 },
  );
}

if (hasAuth && scenarioSet !== "public") {
  scenarios.push(
    { name: "profile-read", method: "GET", path: "/api/me", weight: 1 },
    { name: "favorites-read", method: "GET", path: "/api/me/favorites", weight: 1 },
    { name: "progress-read", method: "GET", path: "/api/me/progress", weight: 1 },
    { name: "library-read", method: "GET", path: "/api/me/library", weight: 1 },
    { name: "plays-read", method: "GET", path: "/api/me/plays", weight: 1 },
    { name: "streak-read", method: "GET", path: "/api/me/streak?tz=America%2FSantiago", weight: 1 },
    { name: "friends-read", method: "GET", path: "/api/friends?page=1&pageSize=50", weight: 1 },
    { name: "dm-conversations", method: "GET", path: "/api/dm/conversations", weight: 1 },
  );
  if (process.env.CAPACITY_DM_PARTNER_USER_ID) {
    const partnerId = integerEnv(
      "CAPACITY_DM_PARTNER_USER_ID",
      0,
      1,
      2_147_483_647,
    );
    scenarios.push({
      name: "dm-thread-read",
      method: "GET",
      path: `/api/dm/with/${partnerId}?limit=50`,
      weight: 2,
    });
  }
}

async function requestJson(path) {
  const response = await fetch(new URL(path, baseUrl), {
    headers: authHeaders,
    redirect: "error",
  });
  if (!response.ok) {
    throw new Error(`Setup request ${path} failed with HTTP ${response.status}`);
  }
  return response.json();
}

if (
  scenarioSet === "public" &&
  process.env.CAPACITY_ENABLE_IDEMPOTENT_WRITES === "YES"
) {
  throw new Error("Idempotent writes cannot be enabled with CAPACITY_SCENARIO_SET=public.");
}

if (process.env.CAPACITY_ENABLE_IDEMPOTENT_WRITES === "YES") {
  if (!hasAuth || process.env.CAPACITY_DEDICATED_TEST_ACCOUNT !== "YES") {
    throw new Error(
      "Idempotent writes require auth and CAPACITY_DEDICATED_TEST_ACCOUNT=YES.",
    );
  }
  const [favorites, progress, library] = await Promise.all([
    requestJson("/api/me/favorites"),
    requestJson("/api/me/progress"),
    requestJson("/api/me/library"),
  ]);
  scenarios.push(
    {
      name: "favorites-sync",
      method: "PUT",
      path: "/api/me/favorites",
      body: favorites,
      weight: 1,
    },
    {
      name: "progress-sync",
      method: "PUT",
      path: "/api/me/progress",
      body: progress,
      weight: 1,
    },
    {
      name: "library-sync",
      method: "PUT",
      path: "/api/me/library",
      body: library,
      weight: 1,
    },
  );
  if (process.env.CAPACITY_DM_PARTNER_USER_ID) {
    const partnerId = integerEnv(
      "CAPACITY_DM_PARTNER_USER_ID",
      0,
      1,
      2_147_483_647,
    );
    scenarios.push(
      {
        name: "dm-send",
        method: "POST",
        path: `/api/dm/with/${partnerId}`,
        body: { body: "Mensaje de prueba de capacidad" },
        weight: 1,
      },
      {
        name: "dm-mark-read",
        method: "POST",
        path: `/api/dm/with/${partnerId}/read`,
        body: {},
        weight: 1,
      },
    );
  }
}

const pool = weightedPool(scenarios);
const resultsByScenario = new Map(scenarios.map((scenario) => [scenario.name, []]));
const allResults = [];
const intervalPerWorkerMs = (concurrency / targetRps) * 1_000;
const startedAt = new Date();
const started = performance.now();
const stopAt = started + durationSeconds * 1_000;

console.log(
  JSON.stringify(
    {
      event: "capacity_test_started",
      profile: profileName,
      baseUrl: baseUrl.origin,
      concurrency,
      targetRps,
      durationSeconds,
      minimumThroughputRps,
      throughputTolerance,
      scenarioSet,
      authenticatedScenarios: hasAuth,
      idempotentWrites: process.env.CAPACITY_ENABLE_IDEMPOTENT_WRITES === "YES",
      scenarios: scenarios.map(({ name, method, path, weight }) => ({
        name,
        method,
        path,
        weight,
      })),
    },
    null,
    2,
  ),
);

async function executeScenario(scenario) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const requestStarted = performance.now();
  try {
    const headers = { ...authHeaders };
    let body;
    if (scenario.body !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(scenario.body);
    }
    const response = await fetch(new URL(scenario.path, baseUrl), {
      method: scenario.method,
      headers,
      body,
      signal: controller.signal,
      redirect: "error",
    });
    const responseBody = await response.arrayBuffer();
    return {
      scenario: scenario.name,
      ok: response.status >= 200 && response.status < 400,
      statusCode: response.status,
      durationMs: performance.now() - requestStarted,
      responseBytes: responseBody.byteLength,
    };
  } catch (error) {
    return {
      scenario: scenario.name,
      ok: false,
      statusCode: 0,
      durationMs: performance.now() - requestStarted,
      responseBytes: 0,
      error: error instanceof Error ? error.name : "UnknownError",
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function worker(workerIndex) {
  await sleep((workerIndex / concurrency) * intervalPerWorkerMs);
  let iteration = workerIndex;
  while (performance.now() < stopAt) {
    const requestStarted = performance.now();
    const scenario = pool[iteration % pool.length];
    const result = await executeScenario(scenario);
    resultsByScenario.get(scenario.name).push(result);
    allResults.push(result);
    iteration += concurrency;
    const remainingDelay = intervalPerWorkerMs - (performance.now() - requestStarted);
    if (remainingDelay > 0) await sleep(remainingDelay);
  }
}

await Promise.all(Array.from({ length: concurrency }, (_, index) => worker(index)));

const actualDurationSeconds = (performance.now() - started) / 1_000;
const aggregate = summarize("aggregate", allResults);
aggregate.throughputRps =
  Math.round((allResults.length / actualDurationSeconds) * 100) / 100;
const scenarioSummaries = [...resultsByScenario.entries()].map(([name, results]) => {
  const summary = summarize(name, results);
  summary.throughputRps =
    Math.round((results.length / actualDurationSeconds) * 100) / 100;
  return summary;
});
const passed =
  aggregate.errorRate <= targetErrorRate &&
  aggregate.latencyMs.p95 <= targetP95Ms &&
  aggregate.throughputRps >= minimumThroughputRps;
const report = {
  version: 1,
  profile: profileName,
  startedAt: startedAt.toISOString(),
  completedAt: new Date().toISOString(),
  target: {
    concurrency,
    targetRps,
    durationSeconds,
    p95Ms: targetP95Ms,
    errorRate: targetErrorRate,
    minimumThroughputRps,
    throughputTolerance,
  },
  actualDurationSeconds: Math.round(actualDurationSeconds * 100) / 100,
  authenticatedScenarios: hasAuth,
  scenarioSet,
  idempotentWrites: process.env.CAPACITY_ENABLE_IDEMPOTENT_WRITES === "YES",
  passed,
  aggregate,
  scenarios: scenarioSummaries,
};

console.log(JSON.stringify(report, null, 2));

const reportPath = process.env.CAPACITY_REPORT_PATH;
if (reportPath) {
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`Capacity report written to ${reportPath}`);
}

if (!passed) process.exitCode = 2;