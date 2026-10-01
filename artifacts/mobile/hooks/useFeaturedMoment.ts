import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getGetFeaturedMomentQueryKey,
  useGetFeaturedMoment,
  type FeaturedMomentResponse,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { AppState } from "react-native";

import { SESSIONS, type Session } from "@/data/sessions";
import { useCatalog } from "@/context/CatalogContext";
import { usePollingInterval } from "@/hooks/usePollingInterval";
import {
  getFeaturedMomentRefreshDelay,
  getChileEditorialDate,
  isEligibleFeaturedMomentResponse,
  isEligibleFeaturedMomentSession,
  featuredMomentStatusMessage,
} from "@/lib/featured-moment-helpers";
import {
  clearTemporaryFeaturedMomentSessions,
  normalizeFeaturedMomentSession,
} from "@/lib/featured-moment-session";
import {
  isFeaturedMomentCatalogCompatible,
  isFeaturedMomentResponseNewerThanCatalog,
} from "@/lib/featured-moment-session-logic";

const CACHE_KEY = "resonancia_featured_moment_v1";
const FOCUSED_POLL_MS = 5 * 60_000;
const FEATURED_MOMENT_QUERY_KEY = getGetFeaturedMomentQueryKey();
const restoredResponses = new WeakSet<object>();
const clockListeners = new Set<() => void>();
let clockRevision = 0;

function subscribeToClock(listener: () => void): () => void {
  clockListeners.add(listener);
  return () => clockListeners.delete(listener);
}

function getClockRevision(): number {
  return clockRevision;
}

function notifyClockChanged(): void {
  clockRevision += 1;
  clockListeners.forEach((listener) => listener());
}
function resolveChoice(
  response: FeaturedMomentResponse | null,
  responseIsFresh: boolean,
  responseFetchedAt: number,
  catalogStatus: "bundled" | "cached" | "remote",
  catalogSessionIds: ReadonlySet<string> | null,
  catalogSnapshotFetchedAt: number,
): { session: Session | null; invalidated: boolean } {
  clearTemporaryFeaturedMomentSessions();
  const remote = response?.session;
  if (!remote) return { session: null, invalidated: false };
  if (!isEligibleFeaturedMomentSession(remote)) {
    return { session: null, invalidated: true };
  }

  const local = SESSIONS.find((session) => session.id === remote.id);
  const localIsEligible = !!local &&
    !local.isPlaceholder &&
    local.categoryId !== "musica-sonidos" &&
    local.categoryId !== "reflexiones";
  const compatibilityInput = {
    sessionId: remote.id,
    catalogStatus,
    catalogSessionIds,
    localSessionIsEligible: localIsEligible,
    featuredResponseIsFresh: responseIsFresh,
    featuredResponseFetchedAt: responseFetchedAt,
    catalogSnapshotFetchedAt,
  };
  if (!isFeaturedMomentCatalogCompatible(compatibilityInput)) {
    return { session: null, invalidated: catalogStatus !== "bundled" || !localIsEligible };
  }

  if (isFeaturedMomentResponseNewerThanCatalog(compatibilityInput)) {
    return { session: normalizeFeaturedMomentSession(remote), invalidated: false };
  }
  return local
    ? { session: local, invalidated: false }
    : { session: null, invalidated: true };
}

export function useFeaturedMoment() {
  const queryClient = useQueryClient();
  const catalog = useCatalog();
  useSyncExternalStore(subscribeToClock, getClockRevision, getClockRevision);
  const queryKey = FEATURED_MOMENT_QUERY_KEY;
  const refetchInterval = usePollingInterval(FOCUSED_POLL_MS);
  const query = useGetFeaturedMoment({
    query: {
      queryKey,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      refetchInterval,
      refetchIntervalInBackground: false,
    },
  });

  const refresh = query.refetch;
  const response = isEligibleFeaturedMomentResponse(query.data) ? query.data : null;
  const responseWasRestored = !!response && restoredResponses.has(response);
  const successfulFetchAfterMount =
    query.isFetchedAfterMount && !query.isRefetchError;
  const responseIsFresh =
    !!response && (!responseWasRestored || successfulFetchAfterMount);
  if (response && responseWasRestored && successfulFetchAfterMount) {
    restoredResponses.delete(response);
  }

  useFocusEffect(
    useCallback(() => {
      notifyClockChanged();
      void refresh();
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") {
          notifyClockChanged();
          void refresh();
        }
      });

      const nextChange = response ? Date.parse(response.nextChangeAt) : NaN;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const scheduleRetry = () => {
        timer = setTimeout(() => {
          notifyClockChanged();
          if (AppState.currentState === "active") void refresh();
          scheduleRetry();
        }, 60_000);
      };
      if (response && Number.isFinite(nextChange)) {
        timer = setTimeout(() => {
          notifyClockChanged();
          if (AppState.currentState === "active") void refresh();
          scheduleRetry();
        }, getFeaturedMomentRefreshDelay(response));
      }

      return () => {
        subscription.remove();
        if (timer) clearTimeout(timer);
      };
    }, [refresh, response?.nextChangeAt]),
  );

  // Restore the last structurally valid server response into the shared query
  // cache. Do not overwrite a newer network response if storage resolves late.
  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (cancelled || !raw || queryClient.getQueryData(queryKey)) return;
        const cached: unknown = JSON.parse(raw);
        if (isEligibleFeaturedMomentResponse(cached)) {
          restoredResponses.add(cached);
          queryClient.setQueryData(queryKey, cached);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [queryClient, queryKey]);

  useEffect(() => {
    if (!response) return;
    void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(response)).catch(() => {});
  }, [response]);

  const today = getChileEditorialDate();
  const choice = useMemo(
    () => resolveChoice(
      response,
      responseIsFresh,
      query.dataUpdatedAt,
      catalog.status,
      catalog.catalogSessionIds,
      catalog.catalogSnapshotFetchedAt,
    ),
    [
      response,
      responseIsFresh,
      query.dataUpdatedAt,
      catalog.status,
      catalog.catalogSessionIds,
      catalog.catalogSnapshotFetchedAt,
      catalog.version,
    ],
  );
  const statusMessage = featuredMomentStatusMessage({
    response,
    today,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: !!query.error,
    invalidated: choice.invalidated,
  });

  return {
    session: choice.session,
    statusMessage,
    isEmpty: !!response && !choice.session && !choice.invalidated &&
      (response.eligibleCount === 0 || response.source === "empty"),
    date: response?.date ?? null,
    isStaleDay: !!response && response.date !== today,
  };
}
