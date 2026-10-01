import { beforeEach, describe, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => ({
  sessions: [] as any[],
  audio: [] as any[],
  state: null as any,
  tables: {
    sessions: Symbol("sessions"),
    audio: Symbol("audio"),
    state: Symbol("state"),
  },
}));

vi.mock("@workspace/db", () => {
  const { tables } = fixture;
  const transaction = async (callback: (tx: any) => unknown) => {
    const run = async () => callback(tx);
    const result = transactionTail.then(run, run);
    transactionTail = result.then(() => undefined, () => undefined);
    return result;
  };
  let transactionTail = Promise.resolve();
  const tx = {
    execute: async () => undefined,
    select: (columns?: unknown) => {
      let table: symbol | undefined;
      const query = {
        from(value: symbol) { table = value; return query; },
        where() { return query; },
        orderBy() { return query; },
        for() { return query; },
        limit() { return query; },
        then(resolve: (value: unknown[]) => unknown, reject: (error: unknown) => unknown) {
          let rows: unknown[] = [];
          if (table === tables.state) rows = fixture.state ? [structuredClone(fixture.state)] : [];
          if (table === tables.sessions) {
            rows = columns
              ? fixture.sessions.filter((session) => session.isPinnedFeatured).map(({ id }) => ({ id }))
              : structuredClone(fixture.sessions);
          }
          if (table === tables.audio) rows = structuredClone(fixture.audio);
          return Promise.resolve(rows).then(resolve, reject);
        },
      };
      return query;
    },
    insert: (table: symbol) => ({
      values(value: any) {
        if (table === tables.state && fixture.state === null) {
          fixture.state = {
            id: 1,
            editorialDate: null,
            automaticSessionId: null,
            automaticExposed: false,
            manualSessionId: null,
            manualDate: null,
            manualFromLegacy: false,
            pendingSessionIds: [],
            knownSessionIds: [],
            lastAutomaticSessionId: null,
            lastShownSessionId: null,
            revision: 0,
            legacyMigrated: false,
            ...value,
          };
        }
        return { onConflictDoNothing: async () => undefined };
      },
    }),
    update: (table: symbol) => ({
      set(value: any) {
        return {
          where: async () => {
            if (table === tables.state && fixture.state) Object.assign(fixture.state, value);
            if (table === tables.sessions && value.isPinnedFeatured === false) {
              fixture.sessions.forEach((session) => { session.isPinnedFeatured = false; });
            }
          },
        };
      },
    }),
  };
  return {
    db: { transaction },
    catalogSessionsTable: tables.sessions,
    catalogAudioFilesTable: tables.audio,
    featuredMomentStateTable: tables.state,
  };
});

vi.mock("drizzle-orm", () => ({
  and: (...values: unknown[]) => values,
  asc: (value: unknown) => value,
  eq: (...values: unknown[]) => values,
  inArray: (...values: unknown[]) => values,
  notInArray: (...values: unknown[]) => values,
  ne: (...values: unknown[]) => values,
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}));

import { getFeaturedMoment, setFeaturedMomentManual } from "./featuredMomentService";

const audio = (sessionId: string) => ({
  id: 1,
  sessionId,
  role: "main",
  url: `/objects/${sessionId}.mp3`,
  assetKey: null,
  name: `${sessionId}.mp3`,
});
const session = (id: string, isPinnedFeatured = false) => ({
  id,
  title: `Session ${id}`,
  subtitle: "Subtitle",
  categoryId: "sonidos-ancestrales",
  categoryLabel: "Sonoterapia",
  duration: 10,
  description: "Ready to play",
  isPlaceholder: false,
  status: "published",
  isPinnedFeatured,
});

describe("featured moment persisted service semantics", () => {
  beforeEach(() => {
    fixture.sessions = [session("a"), session("b"), session("c")];
    fixture.audio = fixture.sessions.map((item) => audio(item.id));
    fixture.state = null;
  });

  it("serializes concurrent same-day reads to one persisted choice and one queue advance", async () => {
    const now = new Date("2025-01-15T12:00:00.000Z");
    const [first, second] = await Promise.all([
      getFeaturedMoment({ now, random: () => 0 }),
      getFeaturedMoment({ now, random: () => 0.99 }),
    ]);
    expect(first.date).toBe(second.date);
    expect(first.automaticSessionId).toBe(second.automaticSessionId);
    expect(fixture.state.revision).toBe(1);
    expect(fixture.state.pendingSessionIds).toHaveLength(2);
    expect(fixture.state.knownSessionIds).toHaveLength(3);
  });

  it("does not consume an unseen automatic when a manual choice is the first action, and clear restores it", async () => {
    const now = new Date("2025-01-15T12:00:00.000Z");
    const date = "2025-01-15";
    const manual = await setFeaturedMomentManual({ sessionId: "b", date, now, random: () => 0 });
    expect("kind" in manual).toBe(false);
    if ("kind" in manual) return;
    expect(manual.source).toBe("manual");
    expect(manual.manualMigrated).toBe(false);
    expect(manual.automaticSessionId).toBeNull();
    expect(fixture.state.pendingSessionIds).toEqual([]);

    const publicManual = await getFeaturedMoment({ now });
    expect(publicManual.source).toBe("manual");
    expect(fixture.state.knownSessionIds).toEqual(["b"]);
    expect(fixture.state.pendingSessionIds).toEqual([]);

    const restored = await setFeaturedMomentManual({ sessionId: null, date, now, random: () => 0 });
    expect("kind" in restored).toBe(false);
    if ("kind" in restored) return;
    expect(restored.source).toBe("automatic");
    const restoredId = restored.automaticSessionId;
    expect(restoredId).not.toBeNull();
    expect(restoredId).not.toBe("b");
    const repeated = await getFeaturedMoment({ now, random: () => 0.99 });
    expect(repeated.automaticSessionId).toBe(restoredId);
  });

  it("migrates one valid legacy pin for today, clears legacy flags, and never revives it tomorrow", async () => {
    fixture.sessions = [session("pinned", true), session("other")];
    fixture.audio = fixture.sessions.map((item) => audio(item.id));
    const today = await getFeaturedMoment({
      now: new Date("2025-01-15T12:00:00.000Z"),
      random: () => 0,
    });
    expect(today.source).toBe("manual");
    expect(today.manualMigrated).toBe(true);
    expect(today.session?.session.id).toBe("pinned");
    expect(fixture.sessions.every((item) => !item.isPinnedFeatured)).toBe(true);
    const normalManual = await setFeaturedMomentManual({
      sessionId: "other",
      date: "2025-01-15",
      now: new Date("2025-01-15T13:00:00.000Z"),
      random: () => 0,
    });
    expect("kind" in normalManual).toBe(false);
    if (!("kind" in normalManual)) expect(normalManual.manualMigrated).toBe(false);
    const nextDay = await getFeaturedMoment({
      now: new Date("2025-01-16T12:00:00.000Z"),
      random: () => 0,
    });
    expect(nextDay.source).toBe("automatic");
    expect(nextDay.manualMigrated).toBe(false);
    expect(nextDay.session?.session.id).toBe("other");
    expect(fixture.state.legacyMigrated).toBe(true);
  });

  it("reports no migrated override when there is no valid legacy pin", async () => {
    fixture.sessions = [session("music")];
    fixture.sessions[0].categoryId = "musica-sonidos";
    fixture.sessions[0].isPinnedFeatured = true;
    fixture.audio = fixture.sessions.map((item) => audio(item.id));
    const response = await getFeaturedMoment({
      now: new Date("2025-01-15T12:00:00.000Z"),
      random: () => 0,
    });
    expect(response.manualMigrated).toBe(false);
    expect(response.source).toBe("empty");
    expect(fixture.sessions[0].isPinnedFeatured).toBe(false);
  });

  it("returns an unexposed admin reservation to the cycle after a manual day", async () => {
    const first = await getFeaturedMoment({
      admin: true,
      now: new Date("2025-01-15T12:00:00.000Z"),
      random: () => 0,
    });
    const reservedId = first.automaticSessionId;
    expect(reservedId).not.toBeNull();
    expect(fixture.state.automaticExposed).toBe(false);
    await setFeaturedMomentManual({
      sessionId: fixture.sessions.find((item) => item.id !== reservedId)!.id,
      date: "2025-01-15",
      now: new Date("2025-01-15T13:00:00.000Z"),
      random: () => 0,
    });
    expect(fixture.state.automaticExposed).toBe(false);
    const tomorrow = await getFeaturedMoment({
      now: new Date("2025-01-16T12:00:00.000Z"),
      random: () => 0.99,
    });
    expect(tomorrow.automaticSessionId).toBe(reservedId);
  });

  it("keeps a publicly exposed automatic consumed after a manual override", async () => {
    const exposed = await getFeaturedMoment({
      now: new Date("2025-01-15T12:00:00.000Z"),
      random: () => 0,
    });
    const exposedId = exposed.automaticSessionId;
    expect(fixture.state.automaticExposed).toBe(true);
    await setFeaturedMomentManual({
      sessionId: fixture.sessions.find((item) => item.id !== exposedId)!.id,
      date: "2025-01-15",
      now: new Date("2025-01-15T13:00:00.000Z"),
      random: () => 0,
    });
    const tomorrow = await getFeaturedMoment({
      now: new Date("2025-01-16T12:00:00.000Z"),
      random: () => 0,
    });
    expect(tomorrow.automaticSessionId).not.toBe(exposedId);
    expect(fixture.state.pendingSessionIds).not.toContain(exposedId);
  });

  it("public manual c after automatic a,b is removed from the cycle and not repeated next day", async () => {
    const dayOne = await getFeaturedMoment({
      now: new Date("2025-01-15T12:00:00.000Z"),
      random: () => 0.99,
    });
    expect(dayOne.automaticSessionId).toBe("a");
    const dayTwo = await getFeaturedMoment({
      now: new Date("2025-01-16T12:00:00.000Z"),
      random: () => 0,
    });
    expect(dayTwo.automaticSessionId).toBe("b");
    expect(fixture.state.pendingSessionIds).toEqual(["c"]);

    await setFeaturedMomentManual({
      sessionId: "c",
      date: "2025-01-16",
      now: new Date("2025-01-16T13:00:00.000Z"),
      random: () => 0,
    });
    const beforePublicManual = fixture.state.revision;
    const publicManual = await getFeaturedMoment({
      now: new Date("2025-01-16T13:01:00.000Z"),
    });
    expect(Number(fixture.state.revision)).toBeGreaterThan(Number(beforePublicManual));
    expect(publicManual.source).toBe("manual");
    expect(fixture.state.pendingSessionIds).toEqual([]);
    expect(fixture.state.knownSessionIds).toContain("c");

    const dayThree = await getFeaturedMoment({
      now: new Date("2025-01-17T12:00:00.000Z"),
      random: () => 0,
    });
    expect(dayThree.source).toBe("automatic");
    expect(dayThree.automaticSessionId).not.toBe("c");
  });

  it("does not count an unexposed admin/manual choice as seen in the cycle", async () => {
    await getFeaturedMoment({
      admin: true,
      now: new Date("2025-01-15T12:00:00.000Z"),
      random: () => 0,
    });
    const beforeQueue = [...fixture.state.pendingSessionIds];
    const beforeKnown = [...fixture.state.knownSessionIds];
    await setFeaturedMomentManual({
      sessionId: "c",
      date: "2025-01-15",
      now: new Date("2025-01-15T13:00:00.000Z"),
    });
    expect(fixture.state.pendingSessionIds).toEqual(beforeQueue);
    expect(fixture.state.knownSessionIds).toEqual(beforeKnown);
    expect(fixture.state.automaticExposed).toBe(false);
  });

  it("does not put an unexposed reservation back if that exact session was publicly shown as manual", async () => {
    const preview = await getFeaturedMoment({
      admin: true,
      now: new Date("2025-01-15T12:00:00.000Z"),
      random: () => 0.99,
    });
    const reservedId = preview.automaticSessionId!;
    await setFeaturedMomentManual({
      sessionId: reservedId,
      date: "2025-01-15",
      now: new Date("2025-01-15T13:00:00.000Z"),
    });
    await getFeaturedMoment({ now: new Date("2025-01-15T13:01:00.000Z") });
    expect(fixture.state.lastShownSessionId).toBe(reservedId);
    const tomorrow = await getFeaturedMoment({
      now: new Date("2025-01-16T12:00:00.000Z"),
      random: () => 0,
    });
    expect(tomorrow.automaticSessionId).not.toBe(reservedId);
  });

  it("invalidates a manual session removed from the eligible catalog", async () => {
    await setFeaturedMomentManual({
      sessionId: "b",
      date: "2025-01-15",
      now: new Date("2025-01-15T12:00:00.000Z"),
      random: () => 0,
    });
    fixture.sessions = fixture.sessions.filter((item) => item.id !== "b");
    fixture.audio = fixture.audio.filter((item) => item.sessionId !== "b");
    const response = await getFeaturedMoment({
      now: new Date("2025-01-15T13:00:00.000Z"),
      random: () => 0,
    });
    expect(response.source).toBe("automatic");
    expect(response.session?.session.id).not.toBe("b");
  });
});