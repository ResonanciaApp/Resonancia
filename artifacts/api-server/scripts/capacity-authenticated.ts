import { randomBytes, randomUUID } from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { clerkClient } from "@clerk/express";
import {
  db,
  directMessagesTable,
  friendshipsTable,
  pool,
  usersTable,
  type User,
} from "@workspace/db";
import { inArray } from "drizzle-orm";

type TestIdentity = {
  clerkUserId: string;
  token: string;
  appUser: User;
};

type CapacityReport = {
  passed: boolean;
  aggregate: {
    requests: number;
    errors: number;
    errorRate: number;
    throughputRps: number;
    latencyMs: { p50: number; p95: number; p99: number; max: number };
  };
};

const baseUrl = new URL(process.env.CAPACITY_BASE_URL ?? "http://127.0.0.1:8080");
const runId = randomUUID().replaceAll("-", "").slice(0, 16);
const reportPath =
  process.env.CAPACITY_REPORT_PATH ??
  `/tmp/resonancia-capacity-authenticated-${runId}.json`;
const createdClerkUserIds: string[] = [];
const createdAppUserIds: number[] = [];
const runExternalIds = [
  `resonancia-capacity-${runId}-a`,
  `resonancia-capacity-${runId}-b`,
];
let activeChild: ChildProcess | undefined;
let interruptedSignal: NodeJS.Signals | undefined;

function handleSignal(signal: NodeJS.Signals): void {
  if (interruptedSignal) return;
  interruptedSignal = signal;
  activeChild?.kill("SIGTERM");
}

process.once("SIGINT", () => handleSignal("SIGINT"));
process.once("SIGTERM", () => handleSignal("SIGTERM"));

function ensureNotInterrupted(): void {
  if (interruptedSignal) {
    throw new Error(`Capacity fixture interrupted by ${interruptedSignal}.`);
  }
}

if (!process.env.CLERK_SECRET_KEY?.startsWith("sk_test_")) {
  throw new Error(
    "Authenticated capacity fixtures are restricted to a Clerk Development instance.",
  );
}
if (process.env.NODE_ENV === "production") {
  throw new Error("Authenticated capacity fixtures cannot run with NODE_ENV=production.");
}
if (process.env.CAPACITY_DATABASE_ENV !== "development") {
  throw new Error(
    "Authenticated capacity fixtures require CAPACITY_DATABASE_ENV=development in the Development environment.",
  );
}
if (!["localhost", "127.0.0.1", "::1"].includes(baseUrl.hostname)) {
  throw new Error("Authenticated capacity fixtures must target a local API workflow.");
}

async function apiRequest<T>(
  token: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init.body !== undefined) headers.set("Content-Type", "application/json");
    const response = await fetch(new URL(path, baseUrl), {
      ...init,
      headers,
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = (await response.text()).slice(0, 300);
      throw new Error(`${init.method ?? "GET"} ${path} failed: HTTP ${response.status} ${text}`);
    }
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function createIdentity(label: "a" | "b"): Promise<TestIdentity> {
  const externalId = `resonancia-capacity-${runId}-${label}`;
  const clerkUser = await clerkClient.users.createUser({
    externalId,
    emailAddress: [`capacity-${runId}-${label}@example.com`],
    password: `${randomBytes(24).toString("base64url")}A1!`,
    firstName: "Capacity",
    lastName: `Test ${label.toUpperCase()}`,
    skipPasswordChecks: true,
    skipLegalChecks: true,
  });
  createdClerkUserIds.push(clerkUser.id);

  const session = await clerkClient.sessions.createSession({ userId: clerkUser.id });
  const token = await clerkClient.sessions.getToken(session.id, undefined, 600);
  const appUser = await apiRequest<User>(token.jwt, "/api/me");
  createdAppUserIds.push(appUser.id);
  return { clerkUserId: clerkUser.id, token: token.jwt, appUser };
}

async function seedUserData(identity: TestIdentity): Promise<string[]> {
  const catalog = await apiRequest<{ sessions: Array<{ id: string }> }>(
    identity.token,
    "/api/catalog",
  );
  const sessionIds = catalog.sessions.slice(0, 60).map((session) => session.id);
  if (sessionIds.length < 20) {
    throw new Error("The catalog needs at least 20 sessions for a representative fixture.");
  }

  await apiRequest(identity.token, "/api/me/favorites", {
    method: "PUT",
    body: JSON.stringify({ sessionIds }),
  });
  await apiRequest(identity.token, "/api/me/progress", {
    method: "PUT",
    body: JSON.stringify({
      items: sessionIds.map((sessionId, index) => ({
        sessionId,
        progress: ((index % 9) + 1) / 10,
      })),
    }),
  });
  await apiRequest(identity.token, "/api/me/library", {
    method: "PUT",
    body: JSON.stringify({
      folders: Array.from({ length: 20 }, (_, index) => ({
        id: `folder-${runId}-${index}`,
        name: `Carpeta ${index + 1}`,
        sessionIds: sessionIds.slice(index, index + 12),
      })),
      playlists: Array.from({ length: 20 }, (_, index) => ({
        id: `playlist-${runId}-${index}`,
        name: `Playlist ${index + 1}`,
        sessionIds: sessionIds.slice(index, index + 15),
      })),
      favFolders: Array.from({ length: 10 }, (_, index) => ({
        id: `favorites-${runId}-${index}`,
        name: `Favoritos ${index + 1}`,
        sessionIds: sessionIds.slice(index, index + 10),
      })),
      pinnedFavoriteIds: sessionIds.slice(0, 12),
      mixerPresets: Array.from({ length: 10 }, (_, index) => ({
        id: `preset-${runId}-${index}`,
        name: `Preset ${index + 1}`,
        sounds: [
          { id: `sound-${index}`, volume: 0.6 },
          { id: `sound-${index + 1}`, volume: 0.4 },
        ],
      })),
      geometrixCreations: Array.from({ length: 10 }, (_, index) => ({
        id: `glyph-${runId}-${index}`,
        name: `Geometría ${index + 1}`,
        active: [`geometry-${index}`],
        settings: {},
      })),
    }),
  });

  const now = Date.now();
  for (let batch = 0; batch < 3; batch += 1) {
    await apiRequest(identity.token, "/api/me/plays", {
      method: "POST",
      body: JSON.stringify({
        events: Array.from({ length: 100 }, (_, offset) => {
          const index = batch * 100 + offset;
          return {
            clientEventId: `capacity-${runId}-${index}`,
            sessionId: sessionIds[index % sessionIds.length],
            categoryId: "capacity",
            categoryLabel: "Prueba de capacidad",
            minutes: (index % 30) + 1,
            completed: index % 3 === 0,
            playedAt: new Date(now - index * 60 * 60 * 1_000).toISOString(),
          };
        }),
      }),
    });
  }
  return sessionIds;
}

async function seedSocialData(a: TestIdentity, b: TestIdentity): Promise<void> {
  await db.insert(friendshipsTable).values({
    requesterId: a.appUser.id,
    addresseeId: b.appUser.id,
    status: "accepted",
  });
  const messages = Array.from({ length: 200 }, (_, index) => ({
    senderId: index % 2 === 0 ? a.appUser.id : b.appUser.id,
    recipientId: index % 2 === 0 ? b.appUser.id : a.appUser.id,
    body: `Mensaje representativo ${index + 1}`,
    createdAt: new Date(Date.now() - (200 - index) * 60_000),
  }));
  for (let index = 0; index < messages.length; index += 100) {
    await db.insert(directMessagesTable).values(messages.slice(index, index + 100));
  }
}

async function runLoadTest(identity: TestIdentity, partnerId: number): Promise<void> {
  ensureNotInterrupted();
  const runnerPath = fileURLToPath(new URL("./capacity-load.mjs", import.meta.url));
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn(process.execPath, [runnerPath], {
      stdio: "inherit",
      env: {
        ...process.env,
        CAPACITY_BASE_URL: baseUrl.origin,
        CAPACITY_PROFILE: process.env.CAPACITY_PROFILE ?? "smoke",
        CAPACITY_SCENARIO_SET: "authenticated",
        CAPACITY_AUTHORIZATION: `Bearer ${identity.token}`,
        CAPACITY_DM_PARTNER_USER_ID: String(partnerId),
        CAPACITY_ENABLE_IDEMPOTENT_WRITES: "YES",
        CAPACITY_DEDICATED_TEST_ACCOUNT: "YES",
        CAPACITY_REPORT_PATH: reportPath,
      },
    });
    activeChild = child;
    child.once("error", reject);
    child.once("exit", (code) => {
      activeChild = undefined;
      resolve(code ?? 1);
    });
  });
  if (exitCode !== 0) {
    throw new Error(`Authenticated capacity test exited with code ${exitCode}`);
  }
}

async function cleanup(): Promise<void> {
  const errors: unknown[] = [];
  const clerkUserIds = new Set(createdClerkUserIds);
  try {
    const discovered = await clerkClient.users.getUserList({
      externalId: runExternalIds,
      limit: runExternalIds.length,
    });
    for (const user of discovered.data) clerkUserIds.add(user.id);
  } catch (error) {
    errors.push(error);
  }

  if (createdAppUserIds.length > 0 || clerkUserIds.size > 0) {
    try {
      if (clerkUserIds.size > 0) {
        await db
          .delete(usersTable)
          .where(inArray(usersTable.clerkUserId, [...clerkUserIds]));
      } else {
        await db.delete(usersTable).where(inArray(usersTable.id, createdAppUserIds));
      }
      const remainingById =
        createdAppUserIds.length > 0
          ? await db
              .select({ id: usersTable.id })
              .from(usersTable)
              .where(inArray(usersTable.id, createdAppUserIds))
          : [];
      const remainingByClerkId =
        clerkUserIds.size > 0
          ? await db
              .select({ id: usersTable.id })
              .from(usersTable)
              .where(inArray(usersTable.clerkUserId, [...clerkUserIds]))
          : [];
      if (remainingById.length > 0 || remainingByClerkId.length > 0) {
        throw new Error("Database fixture users remain after cleanup.");
      }
    } catch (error) {
      errors.push(error);
    }
  }
  for (const clerkUserId of clerkUserIds) {
    try {
      await clerkClient.users.deleteUser(clerkUserId);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length > 0) {
    throw new AggregateError(errors, "One or more fixture cleanup operations failed.");
  }
}

let testFailed = false;
let cleanupFailed = false;
try {
  console.log("Creating isolated Development capacity fixtures...");
  const identityA = await createIdentity("a");
  ensureNotInterrupted();
  const identityB = await createIdentity("b");
  ensureNotInterrupted();
  await seedUserData(identityA);
  ensureNotInterrupted();
  await seedUserData(identityB);
  ensureNotInterrupted();
  await seedSocialData(identityA, identityB);
  ensureNotInterrupted();
  console.log("Running authenticated capacity profile...");
  await runLoadTest(identityA, identityB.appUser.id);
  const report = JSON.parse(await readFile(reportPath, "utf8")) as CapacityReport;
  console.log(
    JSON.stringify(
      {
        event: "authenticated_capacity_fixture_completed",
        passed: report.passed,
        requests: report.aggregate.requests,
        errors: report.aggregate.errors,
        throughputRps: report.aggregate.throughputRps,
        latencyMs: report.aggregate.latencyMs,
        reportPath,
      },
      null,
      2,
    ),
  );
} catch (error) {
  testFailed = true;
  console.error(error instanceof Error ? error.message : error);
} finally {
  console.log("Cleaning isolated Clerk and database fixtures...");
  await cleanup().catch((error) => {
    testFailed = true;
    cleanupFailed = true;
    console.error("Fixture cleanup failed", error instanceof Error ? error.message : error);
  });
  await pool.end();
}

if (cleanupFailed) process.exitCode = 1;
else if (interruptedSignal === "SIGINT") process.exitCode = 130;
else if (interruptedSignal === "SIGTERM") process.exitCode = 143;
else if (testFailed) process.exitCode = 1;