import { useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useToggleSharedMixLike,
  type SharedMixesPage,
} from "@workspace/api-client-react";

/**
 * Parche de like compartido para TODAS las variantes cacheadas de la lista de
 * mezclas de la comunidad (sin parámetros, filtrada por categoría, por autor).
 *
 * Antes cada pantalla parcheaba solo la key sin parámetros
 * (getGetSharedMixesQueryKey()), así que las listas parametrizadas
 * (mezclas-comunidad, mezcla-creador/[userId]) quedaban con contadores
 * desactualizados hasta el siguiente refetch. setQueriesData con el prefijo
 * "/api/mixes" alcanza todas las variantes de una vez.
 */
const MIXES_KEY_PREFIX = ["/api/mixes"] as const;

export function useMixLike() {
  const queryClient = useQueryClient();
  const toggleLike = useToggleSharedMixLike();
  const pending = useRef<Record<number, boolean>>({});

  const patchAll = useCallback(
    (mixId: number, patch: (m: SharedMixesPage["mixes"][number]) => SharedMixesPage["mixes"][number]) => {
      queryClient.setQueriesData<SharedMixesPage>(
        { queryKey: MIXES_KEY_PREFIX },
        (prev) => {
          if (!prev || !Array.isArray(prev.mixes)) return prev;
          return { ...prev, mixes: prev.mixes.map((m) => (m.id === mixId ? patch(m) : m)) };
        },
      );
    },
    [queryClient],
  );

  const applyOptimistic = useCallback(
    (mixId: number, liked: boolean) => {
      patchAll(mixId, (m) => ({
        ...m,
        likedByMe: liked,
        likes: Math.max(0, m.likes + (liked ? 1 : -1)),
      }));
    },
    [patchAll],
  );

  /** Toggle con optimistic update + rollback + reconciliación con el server. */
  const toggle = useCallback(
    (mix: { id: number; likedByMe: boolean }) => {
      if (pending.current[mix.id]) return;
      pending.current[mix.id] = true;
      const nextLiked = !mix.likedByMe;
      applyOptimistic(mix.id, nextLiked);
      toggleLike.mutate(
        { id: mix.id },
        {
          onError: () => applyOptimistic(mix.id, !nextLiked),
          onSettled: () => { pending.current[mix.id] = false; },
          onSuccess: (updated) => {
            patchAll(mix.id, (m) => ({ ...m, likes: updated.likes, likedByMe: updated.likedByMe }));
          },
        },
      );
    },
    [applyOptimistic, patchAll, toggleLike],
  );

  return { toggle, applyOptimistic, patchAll };
}
