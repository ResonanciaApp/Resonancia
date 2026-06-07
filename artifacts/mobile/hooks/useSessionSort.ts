import { useCallback, useMemo, useState } from "react";

import {
  getGetPopularSessionsQueryKey,
  useGetPopularSessions,
} from "@workspace/api-client-react";

import type { Session } from "@/data/sessions";

/**
 * Orden dinámico de las listas de sesiones por categoría.
 *  - default        → "Todas las sesiones" (orden por ID descendente).
 *  - latest         → "Últimas subidas" (ID descendente).
 *  - most-played    → "Más escuchadas" (ranking real de GET /catalog/popular).
 *  - top-rated      → "Las mejores puntuadas" (valoración local del usuario;
 *                     el promedio global queda pendiente de backend).
 */
export type SortKey = "default" | "latest" | "most-played" | "top-rated";

export const SORT_LABELS: Record<SortKey, string> = {
  default: "Todas las sesiones",
  latest: "Últimas subidas",
  "most-played": "Más escuchadas",
  "top-rated": "Las mejores puntuadas",
};

/** Opciones que se muestran en el menú del filtro. */
export const SORT_OPTIONS: SortKey[] = ["latest", "most-played", "top-rated"];

const byIdDesc = (a: Session, b: Session) => parseInt(b.id) - parseInt(a.id);

export function useSessionSort() {
  const [sortKey, setSortKey] = useState<SortKey>("default");

  const { data: popular } = useGetPopularSessions(
    { limit: 50 },
    {
      query: {
        queryKey: getGetPopularSessionsQueryKey({ limit: 50 }),
        staleTime: 5 * 60_000,
      },
    },
  );

  const popularRank = useMemo(() => {
    const map = new Map<string, number>();
    (popular?.sessions ?? []).forEach((s, i) => map.set(s.id, i));
    return map;
  }, [popular]);

  const sortSessions = useCallback(
    (list: Session[], ratings: Record<string, number>): Session[] => {
      switch (sortKey) {
        case "most-played":
          return [...list].sort((a, b) => {
            const ra = popularRank.has(a.id) ? popularRank.get(a.id)! : Infinity;
            const rb = popularRank.has(b.id) ? popularRank.get(b.id)! : Infinity;
            if (ra !== rb) return ra - rb;
            return byIdDesc(a, b);
          });
        case "top-rated":
          return [...list].sort((a, b) => {
            const ra = ratings[a.id] ?? 0;
            const rb = ratings[b.id] ?? 0;
            if (rb !== ra) return rb - ra;
            return byIdDesc(a, b);
          });
        case "latest":
        case "default":
        default:
          return [...list].sort(byIdDesc);
      }
    },
    [sortKey, popularRank],
  );

  return {
    sortKey,
    setSortKey,
    sortLabel: SORT_LABELS[sortKey],
    sortSessions,
  };
}
