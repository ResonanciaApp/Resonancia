import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  useGetGrowthCatalog, useGetMyGrowth, useUnlockGrowthAvatar,
  getGetMyGrowthQueryKey, getGetGrowthCatalogQueryKey, type GrowthCatalog, type GrowthProgress, type GrowthStage, type GrowthWorld,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { usePlayerStats } from "@/context/PlayerContext";
import { allGrowthLevels, type GrowthLevel } from "@/data/growthLevels";
import { normalizeGrowthWorlds } from "@/utils/growthWorlds";

const CATALOG_KEY = "@resonancia/growth-catalog/v1";
const INITIAL_REWARD_IDS = new Set(["semilla", "crecimiento", "vegetacion", "expansion"]);
const initialStages: GrowthStage[] = allGrowthLevels.map(level => ({
  id: level.id, group: level.id.startsWith("ascenso-") ? "ascenso" : "florecimiento",
  name: level.name, startDay: level.startDay, endDay: level.endDay,
  story: level.story, imageUrl: "",
  rewards: INITIAL_REWARD_IDS.has(level.id) ? [{
    id: `${level.id}-avatars`, amount: 5, enabled: true, text: "Desbloquea {cantidad} avatares a elección",
  }] : [],
}));

type GrowthState = {
  worlds: GrowthWorld[];
  stages: GrowthStage[];
  levels: GrowthLevel[];
  currentStage: GrowthStage | null;
  reachedStageIds: string[];
  progress: GrowthProgress | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<{ data?: GrowthProgress; isError: boolean }>;
  unlock: (avatarId: string) => Promise<GrowthProgress>;
  spending: boolean;
};
const Context = createContext<GrowthState | null>(null);

export function GrowthProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn, clerkUserId } = useAuth();
  const { statEvents } = usePlayerStats();
  const client = useQueryClient();
  const [cached, setCached] = useState<GrowthCatalog | null>(null);
  const [savedProgress, setSavedProgress] = useState<{ owner: string; value: GrowthProgress } | null>(null);
  const catalog = useGetGrowthCatalog({ query: { queryKey: getGetGrowthCatalogQueryKey(), staleTime: 30_000, refetchInterval: 60_000 } });
  const key = [...getGetMyGrowthQueryKey(), clerkUserId];
  const query = useGetMyGrowth({ query: {
    queryKey: key, enabled: !!isSignedIn && !!clerkUserId,
    staleTime: 10_000, refetchInterval: 60_000,
  } });
  const mutation = useUnlockGrowthAvatar();
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(CATALOG_KEY).then(raw => {
      if (!raw || !alive) return;
      try {
        const value = JSON.parse(raw);
        if (Array.isArray(value.stages) && Number.isInteger(value.revision)) setCached(value);
      } catch { /* Invalid cache is not authoritative. */ }
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (!catalog.data) return;
    setCached(catalog.data);
    AsyncStorage.setItem(CATALOG_KEY, JSON.stringify(catalog.data)).catch(console.warn);
  }, [catalog.data]);
  useEffect(() => {
    let alive = true;
    setSavedProgress(null);
    if (!isSignedIn || !clerkUserId) return;
    const owner = clerkUserId;
    AsyncStorage.getItem(`@resonancia/growth-progress/${owner}`).then(raw => {
      if (!alive || !raw) return;
      try {
        const value = JSON.parse(raw);
        if (Array.isArray(value.unlockedAvatarIds) && Array.isArray(value.reachedStageIds) && Array.isArray(value.grantedRewards) && Number.isInteger(value.balance)) {
          setSavedProgress({ owner, value });
        }
      } catch { /* Never manufacture an entitlement from an invalid cache. */ }
    });
    return () => { alive = false; };
  }, [clerkUserId, isSignedIn]);
  useEffect(() => {
    if (!clerkUserId || !isSignedIn || !query.data || query.data.ownerClerkUserId !== clerkUserId) return;
    setSavedProgress({ owner: clerkUserId, value: query.data });
    AsyncStorage.setItem(`@resonancia/growth-progress/${clerkUserId}`, JSON.stringify(query.data)).catch(console.warn);
  }, [query.data, clerkUserId, isSignedIn]);
  useEffect(() => {
    if (!isSignedIn) return;
    // Let the existing history sync commit before reconciling server-owned days.
    const timer = setTimeout(() => { void client.invalidateQueries({ queryKey: key }); }, 5000);
    return () => clearTimeout(timer);
  }, [statEvents, isSignedIn, clerkUserId, client]);
  const stages = (catalog.data ?? cached)?.stages ?? initialStages;
  const worlds = useMemo(() => normalizeGrowthWorlds(catalog.data ?? cached ?? { stages: initialStages }), [catalog.data, cached]);
  const progress = isSignedIn
    ? (query.data?.ownerClerkUserId === clerkUserId ? query.data : null)
      ?? (savedProgress?.owner === clerkUserId && savedProgress.value.ownerClerkUserId === clerkUserId ? savedProgress.value : null)
    : null;
  const levels = useMemo(() => stages.map(stage => ({
    ...stage,
    image: stage.imageUrl || allGrowthLevels.find(level => level.id === stage.id)?.image || "",
  })), [stages]);
  const currentStage = isSignedIn ? progress?.currentStage ?? null : stages.find(s => s.id === "intencion") ?? null;
  return <Context.Provider value={{
    worlds, stages, levels, currentStage, progress,
    reachedStageIds: progress?.reachedStageIds ?? (currentStage ? [currentStage.id] : []),
    loading: !!isSignedIn && !progress && query.isLoading,
    error: query.isError || catalog.isError,
    refresh: () => query.refetch(),
    spending: mutation.isPending,
    unlock: async avatarId => {
      if (!isSignedIn || !clerkUserId) throw new Error("Inicia sesión para desbloquear un avatar");
      const result = await mutation.mutateAsync({ data: { avatarId, expectedClerkUserId: clerkUserId } });
      client.setQueryData(key, result);
      setSavedProgress({ owner: clerkUserId, value: result });
      await AsyncStorage.setItem(`@resonancia/growth-progress/${clerkUserId}`, JSON.stringify(result)).catch(console.warn);
      return result;
    },
  }}>{children}</Context.Provider>;
}

export function useGrowth() {
  const value = useContext(Context);
  if (!value) throw new Error("GrowthProvider requerido");
  return value;
}
