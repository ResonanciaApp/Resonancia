import { useCallback, useEffect, useRef, useState } from "react";
import { fetchCommunityFeed, type CommunityFeedEvent } from "@/lib/communityApi";

const POLL_MS = 60_000;

export interface UseCommunityFeedResult {
  events: CommunityFeedEvent[];
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
}

/**
 * Polls GET /community/feed on mount and every 60 seconds.
 * Returns live events (isLive: true) first, then discrete events.
 */
export function useCommunityFeed(): UseCommunityFeedResult {
  const [events, setEvents] = useState<CommunityFeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const load = useCallback(async (isPullRefresh = false) => {
    if (isPullRefresh) {
      if (mountedRef.current) setRefreshing(true);
    }
    try {
      const data = await fetchCommunityFeed();
      if (mountedRef.current) setEvents(data);
    } catch {
      // Keep stale data on error — don't blank the feed.
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Pull-to-refresh callback (passed to RefreshControl).
  const refresh = useCallback(() => { void load(true); }, [load]);

  useEffect(() => {
    mountedRef.current = true;
    void load();
    const id = setInterval(() => void load(), POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(id);
    };
  }, [load]);

  return { events, loading, refreshing, refresh };
}
