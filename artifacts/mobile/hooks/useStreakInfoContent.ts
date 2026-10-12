import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { getGetStreakInfoQueryKey, useGetStreakInfo, type StreakInfoContent, type StreakInfoSettings } from "@workspace/api-client-react";
import { isStreakInfoSettings } from "@/lib/streak-info-content";

const CACHE_KEY = "@resonancia/streak-info-v1";

export function useStreakInfoContent(visible: boolean, initialContent: StreakInfoContent): StreakInfoContent {
  const [cached, setCached] = useState<StreakInfoSettings | null>(null);
  const query = useGetStreakInfo({
    query: {
      queryKey: getGetStreakInfoQueryKey(),
      enabled: visible,
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchInterval: visible ? 30_000 : false,
      retry: 1,
    },
  });
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(CACHE_KEY).then(raw => {
      if (!active || !raw) return;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (isStreakInfoSettings(parsed)) setCached(parsed);
      } catch { /* Ignore a corrupt local cache; keep the bundled initial texts. */ }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!isStreakInfoSettings(query.data)) return;
    setCached(query.data);
    void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(query.data)).catch(() => {});
  }, [query.data]);

  // A failed refresh never replaces previously published text with defaults.
  return isStreakInfoSettings(query.data) ? query.data.content : cached?.content ?? initialContent;
}
