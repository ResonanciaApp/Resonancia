import { and, asc, eq, inArray, notInArray, sql } from "drizzle-orm";
import {
  catalogAudioFilesTable,
  catalogSessionsTable,
  db,
  featuredMomentStateTable,
  type CatalogAudioFile,
  type CatalogSession,
} from "@workspace/db";
import {
  FEATURED_MOMENT_EXCLUDED_CATEGORY_IDS,
  isFeaturedMomentEligible,
} from "./featuredMomentEligibility";
import {
  editorialDate,
  FEATURED_MOMENT_TIME_ZONE,
  migrateLegacyPin,
  nextEditorialBoundary,
  recordManualAsSeen,
  resolveManualOverride,
  takeAutomaticId,
} from "./featuredMomentEngine";

export type FeaturedMomentResolvedSession = {
  session: CatalogSession;
  audioFiles: CatalogAudioFile[];
};

export type FeaturedMomentSnapshot = {
  date: string;
  timezone: string;
  nextChangeAt: string;
  source: "automatic" | "manual" | "empty";
  session: FeaturedMomentResolvedSession | null;
  automaticSessionId: string | null;
  eligibleCount: number;
  revision: string;
  manualMigrated: boolean;
  candidates: FeaturedMomentResolvedSession[];
};

type EligibleSession = FeaturedMomentResolvedSession;

async function loadEligible(tx: Parameters<Parameters<typeof db.transaction>[0]>[0]) {
  const sessions = await tx
    .select()
    .from(catalogSessionsTable)
    .where(
      and(
        eq(catalogSessionsTable.status, "published"),
        eq(catalogSessionsTable.isPlaceholder, false),
        notInArray(catalogSessionsTable.categoryId, [...FEATURED_MOMENT_EXCLUDED_CATEGORY_IDS]),
      ),
    )
    .orderBy(asc(catalogSessionsTable.id));
  if (sessions.length === 0) return [] as EligibleSession[];
  const audioFiles = await tx
    .select()
    .from(catalogAudioFilesTable)
    .where(inArray(catalogAudioFilesTable.sessionId, sessions.map((item) => item.id)))
    .orderBy(asc(catalogAudioFilesTable.id));
  const audioBySession = new Map<string, CatalogAudioFile[]>();
  for (const audio of audioFiles) {
    if (!audio.sessionId) continue;
    const files = audioBySession.get(audio.sessionId) ?? [];
    files.push(audio);
    audioBySession.set(audio.sessionId, files);
  }
  return sessions
    .map((session) => ({ session, audioFiles: audioBySession.get(session.id) ?? [] }))
    .filter(({ session, audioFiles }) => isFeaturedMomentEligible(session, audioFiles));
}

function bumpRevision(value: number): number {
  return value >= 2_147_483_647 ? 1 : value + 1;
}

/**
 * Resolves and persists the singleton daily selection under one PostgreSQL
 * advisory lock. The editor's manual pick never consumes the pending cycle.
 */
export async function getFeaturedMoment(options?: {
  now?: Date;
  random?: () => number;
  admin?: boolean;
}): Promise<FeaturedMomentSnapshot> {
  const random = options?.random ?? Math.random;
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('featured_moment_daily_cycle'))`);
    const now = options?.now ?? new Date();
    const today = editorialDate(now);
    await tx
      .insert(featuredMomentStateTable)
      .values({ id: 1 })
      .onConflictDoNothing();
    let [state] = await tx
      .select()
      .from(featuredMomentStateTable)
      .where(eq(featuredMomentStateTable.id, 1))
      .for("update")
      .limit(1);
    if (!state) throw new Error("No se pudo inicializar el estado de Para este momento");

    const eligible = await loadEligible(tx);
    const byId = new Map(eligible.map((item) => [item.session.id, item]));
    let changed = false;

    if (state.editorialDate !== today) {
      const reservedWasPubliclyShownAsManual =
        state.manualSessionId !== null &&
        state.manualSessionId === state.automaticSessionId &&
        state.lastShownSessionId === state.manualSessionId;
      if (
        state.automaticSessionId &&
        !state.automaticExposed &&
        !reservedWasPubliclyShownAsManual &&
        byId.has(state.automaticSessionId)
      ) {
        state.pendingSessionIds = [
          state.automaticSessionId,
          ...state.pendingSessionIds.filter((id: string) => id !== state.automaticSessionId),
        ];
      }
      state.editorialDate = today;
      state.automaticSessionId = null;
      state.automaticExposed = false;
      state.manualSessionId = null;
      state.manualDate = null;
      state.manualFromLegacy = false;
      changed = true;
    }

    // One-time migration of a valid old pin into a today-only override.
    // Do this after the day rollover so the newly imported override cannot
    // be mistaken for yesterday's manual choice and immediately cleared.
    if (!state.legacyMigrated) {
      const pinned = await tx
        .select({ id: catalogSessionsTable.id })
        .from(catalogSessionsTable)
        .where(eq(catalogSessionsTable.isPinnedFeatured, true))
        .orderBy(asc(catalogSessionsTable.id));
      const legacyId = migrateLegacyPin(
        pinned.map((item) => item.id),
        eligible.map((item) => item.session.id),
        state.legacyMigrated,
      );
      if (legacyId) {
        state.manualSessionId = legacyId;
        state.manualDate = today;
        state.manualFromLegacy = true;
      } else {
        state.manualFromLegacy = false;
      }
      state.legacyMigrated = true;
      await tx.update(catalogSessionsTable)
        .set({ isPinnedFeatured: false })
        .where(eq(catalogSessionsTable.isPinnedFeatured, true));
      changed = true;
    }

    const validManualId = resolveManualOverride(
      state.manualSessionId,
      state.manualDate,
      today,
      eligible.map((item) => item.session.id),
    );
    if (
      state.manualSessionId !== validManualId ||
      (validManualId === null && state.manualDate !== null)
    ) {
      state.manualSessionId = validManualId;
      state.manualDate = null;
      state.manualFromLegacy = false;
      changed = true;
    }
    if (state.automaticSessionId && !byId.has(state.automaticSessionId)) {
      state.automaticSessionId = null;
      state.automaticExposed = false;
      changed = true;
    }

    // Reserve/generate automatic selection only when it is requested by the
    // public day view or needed to restore automatic after clearing a manual.
    if (!state.automaticSessionId && !state.manualSessionId) {
      const picked = takeAutomaticId(
        eligible.map((item) => item.session.id),
        {
          queue: state.pendingSessionIds,
          knownSessionIds: state.knownSessionIds,
          lastAutomaticId: state.lastAutomaticSessionId,
        },
        state.lastShownSessionId,
        random,
      );
      state.automaticSessionId = picked.id;
      state.automaticExposed = false;
      state.pendingSessionIds = picked.cycle.queue;
      state.knownSessionIds = picked.cycle.knownSessionIds;
      changed = true;
    }

    if (!options?.admin) {
      if (state.manualSessionId) {
        const seen = recordManualAsSeen(state.manualSessionId, {
          queue: state.pendingSessionIds,
          knownSessionIds: state.knownSessionIds,
          lastAutomaticId: state.lastAutomaticSessionId,
        });
        if (seen.changed) {
          state.pendingSessionIds = seen.cycle.queue;
          state.knownSessionIds = seen.cycle.knownSessionIds;
          changed = true;
        }
        if (state.lastShownSessionId !== state.manualSessionId) {
          state.lastShownSessionId = state.manualSessionId;
          changed = true;
        }
      } else if (state.automaticSessionId && !state.manualSessionId) {
        if (!state.automaticExposed || state.lastShownSessionId !== state.automaticSessionId) {
          state.automaticExposed = true;
          state.lastShownSessionId = state.automaticSessionId;
          state.lastAutomaticSessionId = state.automaticSessionId;
          changed = true;
        }
      }
    }
    if (changed) state.revision = bumpRevision(state.revision);
    await tx.update(featuredMomentStateTable).set({
      editorialDate: state.editorialDate,
      automaticSessionId: state.automaticSessionId,
      automaticExposed: state.automaticExposed,
      manualSessionId: state.manualSessionId,
      manualDate: state.manualDate,
      manualFromLegacy: state.manualFromLegacy,
      pendingSessionIds: state.pendingSessionIds,
      knownSessionIds: state.knownSessionIds,
      lastAutomaticSessionId: state.lastAutomaticSessionId,
      lastShownSessionId: state.lastShownSessionId,
      revision: state.revision,
      legacyMigrated: state.legacyMigrated,
    }).where(eq(featuredMomentStateTable.id, 1));

    const selectedId = state.manualSessionId ?? state.automaticSessionId;
    return {
      date: today,
      timezone: FEATURED_MOMENT_TIME_ZONE,
      nextChangeAt: nextEditorialBoundary(now).toISOString(),
      source: selectedId ? (state.manualSessionId ? "manual" : "automatic") : "empty",
      session: selectedId ? (byId.get(selectedId) ?? null) : null,
      automaticSessionId: state.automaticSessionId,
      eligibleCount: eligible.length,
      revision: String(state.revision),
      manualMigrated:
        state.manualFromLegacy &&
        state.manualSessionId !== null &&
        state.manualDate === today,
      candidates: options?.admin ? eligible : [],
    };
  });
}

export async function setFeaturedMomentManual(input: {
  sessionId: string | null;
  date: string;
  now?: Date;
  random?: () => number;
}): Promise<FeaturedMomentSnapshot | { kind: "stale-date" } | { kind: "not-eligible" }> {
  const now = input.now;
  const today = editorialDate(now ?? new Date());
  if (input.date !== today) return { kind: "stale-date" };

  const outcome = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('featured_moment_daily_cycle'))`);
    const lockedDate = editorialDate(input.now ?? new Date());
    if (input.date !== lockedDate) return { kind: "stale-date" as const };
    await tx.insert(featuredMomentStateTable).values({ id: 1 }).onConflictDoNothing();
    let [state] = await tx.select().from(featuredMomentStateTable)
      .where(eq(featuredMomentStateTable.id, 1)).for("update").limit(1);
    if (!state) throw new Error("No se pudo inicializar el estado de Para este momento");
    const eligible = await loadEligible(tx);
    const byId = new Map(eligible.map((item) => [item.session.id, item]));

    // Run one-time import/cleanup before a manual write, without advancing the
    // automatic queue; explicit manual actions must not consume it.
    if (!state.legacyMigrated) {
      const validPinned = await tx.select({ id: catalogSessionsTable.id })
        .from(catalogSessionsTable)
        .where(eq(catalogSessionsTable.isPinnedFeatured, true))
        .orderBy(asc(catalogSessionsTable.id));
      const legacyId = migrateLegacyPin(
        validPinned.map((item) => item.id),
        eligible.map((item) => item.session.id),
        state.legacyMigrated,
      );
      if (legacyId) {
        state.manualSessionId = legacyId;
        state.manualDate = today;
        state.manualFromLegacy = true;
      } else {
        state.manualFromLegacy = false;
      }
      state.legacyMigrated = true;
      await tx.update(catalogSessionsTable).set({ isPinnedFeatured: false })
        .where(eq(catalogSessionsTable.isPinnedFeatured, true));
    }
    if (input.sessionId !== null && !byId.has(input.sessionId)) {
      return { kind: "not-eligible" as const };
    }
    if (state.editorialDate !== today) {
      const reservedWasPubliclyShownAsManual =
        state.manualSessionId !== null &&
        state.manualSessionId === state.automaticSessionId &&
        state.lastShownSessionId === state.manualSessionId;
      if (
        state.automaticSessionId &&
        !state.automaticExposed &&
        !reservedWasPubliclyShownAsManual &&
        byId.has(state.automaticSessionId)
      ) {
        state.pendingSessionIds = [
          state.automaticSessionId,
          ...state.pendingSessionIds.filter((id: string) => id !== state.automaticSessionId),
        ];
      }
      state.editorialDate = today;
      state.automaticSessionId = null;
      state.automaticExposed = false;
      state.manualSessionId = null;
      state.manualDate = null;
      state.manualFromLegacy = false;
    }
    state.manualSessionId = input.sessionId;
    state.manualDate = input.sessionId === null ? null : today;
    state.manualFromLegacy = false;
    state.revision = bumpRevision(state.revision);
    await tx.update(featuredMomentStateTable).set({
      editorialDate: state.editorialDate,
      automaticSessionId: state.automaticSessionId,
      automaticExposed: state.automaticExposed,
      manualSessionId: state.manualSessionId,
      manualDate: state.manualDate,
      manualFromLegacy: state.manualFromLegacy,
      pendingSessionIds: state.pendingSessionIds,
      knownSessionIds: state.knownSessionIds,
      lastAutomaticSessionId: state.lastAutomaticSessionId,
      lastShownSessionId: state.lastShownSessionId,
      revision: state.revision,
      legacyMigrated: state.legacyMigrated,
    }).where(eq(featuredMomentStateTable.id, 1));
    return { kind: "updated" as const };
  });
  if (outcome.kind !== "updated") return outcome;
  return getFeaturedMoment({ ...(now ? { now } : {}), random: input.random, admin: true });
}