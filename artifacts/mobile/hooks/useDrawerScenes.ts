import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetDrawerScenes, type DrawerScene } from "@workspace/api-client-react";

const CACHE = "@resonance_drawer_scenes";
export function useDrawerScenes() {
  const [cached, setCached] = useState<DrawerScene[]>([]);
  const query = useGetDrawerScenes({ query: { staleTime: 60_000, refetchInterval: 60_000 } });
  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(CACHE).then(value => {
      if (!active || !value) return;
      try {
        const items = JSON.parse(value);
        if (Array.isArray(items) && items.every(item => typeof item.id === "string" && typeof item.title === "string")) setCached(items);
      } catch { /* Ignore malformed cache; defaults remain visible. */ }
    }).catch(() => {});
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (query.data) void AsyncStorage.setItem(CACHE, JSON.stringify(query.data.scenes)).catch(() => {});
  }, [query.data]);
  return query.data?.scenes ?? cached;
}
