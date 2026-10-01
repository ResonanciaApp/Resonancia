import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { URL } from "node:url";

import {
  featuredMomentStatusMessage,
  getChileEditorialDate,
  getFeaturedMomentRefreshDelay,
  isEligibleFeaturedMomentResponse,
} from "../lib/featured-moment-helpers.ts";
import {
  isFeaturedMomentCatalogCompatible,
  normalizeFeaturedMomentSessionData,
} from "../lib/featured-moment-session-logic.ts";
import type { CatalogSession } from "@workspace/api-client-react";
import type { Session } from "../data/sessions.ts";

test("Para este momento uses the shared sleep-session duration clock on Inicio and Descubrir", () => {
  for (const screen of ["inicio8", "explore"]) {
    const source = readFileSync(new URL(`../app/(tabs)/${screen}.tsx`, import.meta.url), "utf8");
    const badge = source.match(/<SessionDurationBadge\s+label=\{featuredMoment\.durationLabel\}[^>]*\/>/)?.[0];
    assert.ok(badge, `Missing featured duration badge on ${screen}`);
    assert.match(badge, /\bshowClock\b/);
    assert.match(badge, /\bwhiteGlass\b/);
  }
});

test("Inicio and Descubrir use the same server-backed selection without a local rotation fallback", () => {
  const hookSource = readFileSync(new URL("../hooks/useFeaturedMoment.ts", import.meta.url), "utf8");
  for (const screen of ["inicio8", "explore"]) {
    const source = readFileSync(new URL(`../app/(tabs)/${screen}.tsx`, import.meta.url), "utf8");
    assert.match(source, /useFeaturedMoment\(\)/);
    assert.doesNotMatch(source, /useGetPinnedFeatured|resolveFeaturedMoment/);
  }
  assert.match(hookSource, /useGetFeaturedMoment/);
  assert.match(hookSource, /getGetFeaturedMomentQueryKey/);
  assert.match(hookSource, /AsyncStorage\.setItem\(CACHE_KEY/);
  assert.match(hookSource, /queryClient\.setQueryData/);
  assert.match(hookSource, /AppState\.addEventListener/);
  assert.match(hookSource, /state === "active"/);
  assert.match(hookSource, /useFocusEffect/);
  assert.match(hookSource, /useSyncExternalStore/);
  assert.match(hookSource, /notifyClockChanged\(\);\s*if \(AppState\.currentState === "active"\)/);
  assert.match(hookSource, /!query\.isRefetchError/);
  assert.match(hookSource, /getFeaturedMomentRefreshDelay/);
});

function response(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  const session = {
    id: "remote-session",
    title: "Sesión remota",
    categoryId: "ambientales",
    isPlaceholder: false,
    status: "published",
  };
  return {
    date: "2026-09-16",
    timezone: "America/Santiago",
    nextChangeAt: "2026-09-17T03:00:00.000Z",
    source: "automatic",
    session,
    automaticSessionId: session.id,
    eligibleCount: 4,
    revision: "revision-1",
    manualMigrated: false,
    ...overrides,
  };
}

test("valid known choice is retained for its day or explicitly shown as previous-day cache", () => {
  const current = response();
  assert.equal(isEligibleFeaturedMomentResponse(current), true);
  assert.equal(
    featuredMomentStatusMessage({
      response: current as never,
      today: "2026-09-16",
      isLoading: false,
      isFetching: true,
      isError: false,
      invalidated: false,
    }),
    "Selección guardada · actualizando",
  );
  assert.equal(
    featuredMomentStatusMessage({
      response: current as never,
      today: "2026-09-16",
      isLoading: false,
      isFetching: false,
      isError: true,
      invalidated: false,
    }),
    "No se pudo actualizar · mostrando selección guardada",
  );
  assert.equal(
    featuredMomentStatusMessage({
      response: current as never,
      today: "2026-09-17",
      isLoading: false,
      isFetching: false,
      isError: true,
      invalidated: false,
    }),
    "Selección anterior · no se pudo actualizar",
  );
});

test("successful empty response is explicit, while an error with no cache is not a fake empty result", () => {
  const empty = response({
    source: "empty",
    session: null,
    automaticSessionId: null,
    eligibleCount: 0,
  });
  assert.equal(isEligibleFeaturedMomentResponse(empty), true);
  assert.equal(
    featuredMomentStatusMessage({
      response: empty as never,
      today: "2026-09-16",
      isLoading: false,
      isFetching: false,
      isError: false,
      invalidated: false,
    }),
    "Hoy no hay sesiones disponibles",
  );
  assert.equal(
    featuredMomentStatusMessage({
      response: null,
      today: "2026-09-16",
      isLoading: false,
      isFetching: false,
      isError: true,
      invalidated: false,
    }),
    "No se pudo cargar Para este momento",
  );
});

test("selector validates currently known ineligible, retired, placeholder and music sessions", () => {
  for (const overrides of [
    { categoryId: "musica-sonidos" },
    { categoryId: "reflexiones" },
    { isPlaceholder: true },
    { status: "pending" },
  ]) {
    assert.equal(
      isEligibleFeaturedMomentResponse(
        response({
          session: {
            ...(response().session as Record<string, unknown>),
            ...overrides,
          },
        }),
      ),
      false,
    );
  }
});

test("Chile date and refresh timing use server's exact daily boundary", () => {
  assert.equal(getChileEditorialDate(new Date("2026-09-17T02:59:59.000Z")), "2026-09-16");
  assert.equal(
    getFeaturedMomentRefreshDelay(
      { nextChangeAt: "2026-09-17T03:00:00.000Z" } as never,
      Date.parse("2026-09-17T02:59:00.000Z"),
    ),
    60_000,
  );
  assert.equal(
    getFeaturedMomentRefreshDelay(
      { nextChangeAt: "2026-09-17T03:00:00.000Z" } as never,
      Date.parse("2026-09-17T03:00:00.000Z"),
    ),
    60_000,
  );
});

test("a fresh featured response outranks an older cached catalog but newer remote retirement wins", () => {
  const catalog = {
    sessionId: "newly-published",
    catalogSessionIds: new Set(["older-id"]),
    localSessionIsEligible: false,
    featuredResponseFetchedAt: 200,
    catalogSnapshotFetchedAt: 100,
  };
  assert.equal(
    isFeaturedMomentCatalogCompatible({
      ...catalog,
      catalogStatus: "cached",
      featuredResponseIsFresh: true,
    }),
    true,
  );
  assert.equal(
    isFeaturedMomentCatalogCompatible({
      ...catalog,
      catalogStatus: "remote",
      featuredResponseFetchedAt: 100,
      catalogSnapshotFetchedAt: 200,
      featuredResponseIsFresh: true,
    }),
    false,
  );
  assert.equal(
    isFeaturedMomentCatalogCompatible({
      ...catalog,
      catalogStatus: "remote",
      featuredResponseIsFresh: false,
      catalogSnapshotFetchedAt: 200,
    }),
    false,
  );
  assert.equal(
    isFeaturedMomentCatalogCompatible({
      ...catalog,
      catalogStatus: "remote",
      featuredResponseFetchedAt: 300,
      catalogSnapshotFetchedAt: 200,
      featuredResponseIsFresh: true,
    }),
    true,
  );
  assert.equal(
    isFeaturedMomentCatalogCompatible({
      ...catalog,
      catalogStatus: "cached",
      featuredResponseIsFresh: false,
    }),
    false,
  );
});

test("fresh remote metadata overrides bundled flags while bundle audio markers remain local", () => {
  const bundled = {
    id: "1",
    title: "Bundled",
    subtitle: "",
    categoryId: "meditaciones-guiadas",
    categoryLabel: "Meditaciones",
    duration: 20,
    durationLabel: "20 min",
    description: "",
    benefits: [],
    instruments: [],
    image: 17,
    audio: 22,
    isPremium: false,
    isPlaceholder: false,
  } as unknown as Session;
  const remote = {
    id: bundled.id,
    title: "Remote title",
    subtitle: "Remote subtitle",
    categoryId: bundled.categoryId,
    categoryLabel: bundled.categoryLabel,
    duration: 12,
    durationLabel: "12 min",
    description: "Remote description",
    benefits: [],
    instruments: [],
    isFeatured: false,
    isFeaturedCategory: false,
    isFeaturedSleep: false,
    isNew: true,
    isPremium: true,
    isPlaceholder: false,
    skipDetail: false,
    skipMiniPlayer: false,
    isLoop: false,
    status: "published",
    audioFiles: [{
      id: 1,
      role: "main",
      assetKey: "bundle:1",
      url: "bundle:1",
      name: "Bundled audio",
      isLoop: false,
      createdAt: "",
    }],
  } as unknown as CatalogSession;
  let resolverCalls = 0;
  const resolveMediaUri = (value: string | null | undefined) => {
    resolverCalls += 1;
    return value ?? undefined;
  };
  const normalized = normalizeFeaturedMomentSessionData(remote, bundled, 99, resolveMediaUri);
  assert.equal(normalized.title, "Remote title");
  assert.equal(normalized.isPremium, true);
  assert.equal(normalized.skipDetail, false);
  assert.equal(normalized.skipMiniPlayer, false);
  assert.equal(normalized.isLoop, false);
  assert.equal(normalized.audio, bundled.audio);
  assert.equal(normalized.audioUri, undefined);
  assert.doesNotMatch(normalized.audioUri ?? "", /bundle:/);
  assert.equal(resolverCalls, 0, "bundle markers must never reach absolute URL resolution");

  const remoteAudio = normalizeFeaturedMomentSessionData(
    {
      ...remote,
      audioFiles: [{
        ...remote.audioFiles[0],
        assetKey: null,
        url: "https://media.example/audio.mp3",
      }],
    },
    bundled,
    99,
    resolveMediaUri,
  );
  assert.equal(remoteAudio.audioUri, "https://media.example/audio.mp3");
  assert.equal(resolverCalls, 1);
});

test("temporary normalized featured sessions remain reachable by detail route without catalog mutation", () => {
  const route = readFileSync(new URL("../app/session/[id].tsx", import.meta.url), "utf8");
  assert.match(route, /getTemporaryFeaturedMomentSession/);
  assert.match(route, /getTemporaryFeaturedMomentSession\(id \?\? ""\)\s*\?\?\s*getSessionById/);
  const registry = readFileSync(new URL("../lib/featured-moment-session.ts", import.meta.url), "utf8");
  assert.match(registry, /temporaryFeaturedSessions\.set/);
});