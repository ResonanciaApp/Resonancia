/**
 * useGeometrixCatalog
 * ─────────────────────────────────────────────────────────────────────────────
 * Devuelve la lista de geometrías con los ajustes del servidor aplicados:
 *   - Visibilidad (las marcadas como ocultas se filtran del carrusel)
 *   - Orden por categoría (sortOrder del server)
 *   - Nombre overrideado (name != null → sustituye al defaultName)
 *   - Tipo (wireframe / mosaic) y modo de trazo (thin / natural)
 *
 * Fallback offline: si el fetch falla o aún está cargando → GEOMETRIES sin cambios.
 * El hook re-usa la caché de TanStack Query configurada en la app.
 */
import { useMemo } from "react";
import { useGetGeometrixSettings } from "@workspace/api-client-react";
import { GEOMETRIES, type GeometryMeta, type GeometryCategory } from "@/data/geometries";

export interface GeometryMetaExtended extends GeometryMeta {
  /** Nombre que debe mostrarse (override o defaultName). */
  displayName: string;
  /** Tipo determinado por el servidor (wireframe vs mosaico). */
  geometryType: "wireframe" | "mosaic";
  /** Modo de trazo para wireframes (fino vs natural). */
  strokeMode: "thin" | "natural";
  /** Descripción para la sección Aprende (null si no hay). */
  description: string | null;
  /** Color de trazo override (hex). null = usar el color del PALETTE de la app. */
  color: string | null;
}

export function useGeometrixCatalog(): {
  geometries: GeometryMetaExtended[];
  byCategory: (cat: GeometryCategory) => GeometryMetaExtended[];
  isLoading: boolean;
} {
  const { data, isLoading } = useGetGeometrixSettings({
    query: {
      staleTime: 5 * 60 * 1000,
      retry: false,
    },
  });

  const geometries = useMemo<GeometryMetaExtended[]>(() => {
    if (!data?.geometries?.length) {
      return GEOMETRIES.map((g) => ({
        ...g,
        displayName: g.name,
        geometryType: "wireframe" as const,
        strokeMode: "natural" as const,
        description: null,
        color: null,
      }));
    }

    const settingsMap = new Map(data.geometries.map((s) => [s.id, s]));

    const categorized: Record<GeometryCategory, GeometryMetaExtended[]> = {
      circulares: [],
      rectilineas: [],
      combinaciones: [],
    };

    for (const g of GEOMETRIES) {
      const s = settingsMap.get(g.id);
      if (s && !s.visible) continue;
      categorized[g.category].push({
        ...g,
        name: s?.name ?? g.name,
        displayName: s?.name ?? g.name,
        geometryType: (s?.geometryType as "wireframe" | "mosaic") ?? "wireframe",
        strokeMode: (s?.strokeMode as "thin" | "natural") ?? "natural",
        description: s?.description ?? null,
        color: s?.color ?? null,
      });
    }

    // Ordenar por sortOrder dentro de cada categoría
    for (const cat of Object.keys(categorized) as GeometryCategory[]) {
      categorized[cat].sort((a, b) => {
        const sa = settingsMap.get(a.id);
        const sb = settingsMap.get(b.id);
        return (sa?.sortOrder ?? 999) - (sb?.sortOrder ?? 999);
      });
    }

    return [
      ...categorized.circulares,
      ...categorized.rectilineas,
      ...categorized.combinaciones,
    ];
  }, [data]);

  const byCategory = useMemo(
    () => (cat: GeometryCategory) => geometries.filter((g) => g.category === cat),
    [geometries],
  );

  return { geometries, byCategory, isLoading };
}
