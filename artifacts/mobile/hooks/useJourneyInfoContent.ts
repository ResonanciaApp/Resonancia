import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { getGetJourneyInfoQueryKey, useGetJourneyInfo, type JourneyInfoSettings } from "@workspace/api-client-react";
import { INITIAL_JOURNEY_INFO, isJourneyInfoSettings } from "@/lib/journey-info-content";

const CACHE_KEY = "@resonancia/journey-info-v1";
export function useJourneyInfoContent(visible: boolean) {
  const [cached, setCached] = useState<JourneyInfoSettings | null>(null);
  const query = useGetJourneyInfo({
    query: {
      queryKey: getGetJourneyInfoQueryKey(),
      enabled: visible, staleTime: 0, refetchOnMount: "always",
      refetchOnWindowFocus: true, refetchInterval: visible ? 30_000 : false, retry: 1,
    },
  });
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(CACHE_KEY).then(raw => {
      if (!active || !raw) return;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isJourneyInfoSettings(parsed)) setCached(parsed);
      } catch { /* Ignore corrupt cache. */ }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!isJourneyInfoSettings(query.data)) return;
    setCached(query.data);
    void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(query.data)).catch(() => {});
  }, [query.data]);
  return isJourneyInfoSettings(query.data) ? query.data.content : cached?.content ?? INITIAL_JOURNEY_INFO;
}
