/**
 * CatalogContext — lee el catálogo (categorías, sesiones, metadata de audio) del
 * servidor y lo hidrata in-place sobre los arrays bundleados (SESSIONS /
 * CATEGORIES), conservando los assets locales (image/audio resueltos por id).
 * ─────────────────────────────────────────────────────────────────
 * Offline-first:
 * 1. Los datos bundleados ya son válidos al arrancar (paridad 1:1 con el seed).
 * 2. Al montar, se aplica el último snapshot cacheado en AsyncStorage (rápido,
 *    sin red).
 * 3. En paralelo se pide GET /catalog; al responder se hidrata in-place, se
 *    cachea y se incrementa `version` (los consumidores que lo usen refrescan).
 *
 * No bloquea el render ni remonta el árbol: las pantallas importan SESSIONS /
 * CATEGORIES de forma síncrona y siguen funcionando con los datos bundleados;
 * los cambios remotos (texto/flags/tags) se reflejan al re-renderizar.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useGetCatalog } from "@workspace/api-client-react";
import type { CatalogResponse } from "@workspace/api-client-react";

import {
  applyCatalogSnapshot,
  type CatalogSessionSnapshot,
} from "@/data/sessions";
import {
  applyCategoriesSnapshot,
  type CatalogCategorySnapshot,
} from "@/data/categories";
import {
  applyPlaylistsSnapshot,
  type PlaylistSnapshot,
} from "@/data/playlists";

const CACHE_KEY = "cdc_catalog_snapshot_v1";

type CatalogStatus = "bundled" | "cached" | "remote";

type CatalogContextValue = {
  /** Origen de los datos actualmente aplicados. */
  status: CatalogStatus;
  /** Se incrementa cada vez que se aplica un snapshot nuevo (cache o red). */
  version: number;
};

const CatalogContext = createContext<CatalogContextValue>({
  status: "bundled",
  version: 0,
});

function hydrate(snapshot: {
  categories: CatalogCategorySnapshot[];
  sessions: CatalogSessionSnapshot[];
  playlists?: PlaylistSnapshot[];
}): void {
  applyCategoriesSnapshot(snapshot.categories);
  applyCatalogSnapshot(snapshot.sessions);
  if (snapshot.playlists) {
    applyPlaylistsSnapshot(snapshot.playlists);
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CatalogStatus>("bundled");
  const [version, setVersion] = useState(0);
  const lastSignature = useRef<string | null>(null);

  // 1) Aplicar el snapshot cacheado al montar (offline / arranque rápido).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (!raw || cancelled) return;
        const parsed = JSON.parse(raw) as CatalogResponse;
        if (!parsed?.categories || !parsed?.sessions) return;
        const signature = JSON.stringify(parsed);
        if (signature === lastSignature.current) return;
        hydrate(parsed);
        lastSignature.current = signature;
        if (!cancelled) {
          setStatus("cached");
          setVersion((v) => v + 1);
        }
      } catch {
        // Cache corrupto o ausente → seguimos con los datos bundleados.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2) Traer el catálogo fresco del servidor.
  const { data } = useGetCatalog();

  useEffect(() => {
    if (!data?.categories || !data?.sessions) return;
    const signature = JSON.stringify(data);
    if (signature === lastSignature.current) return;
    hydrate(data);
    lastSignature.current = signature;
    setStatus("remote");
    setVersion((v) => v + 1);
    AsyncStorage.setItem(CACHE_KEY, signature).catch(() => {
      // Si falla el guardado del cache, el próximo arranque usa lo bundleado.
    });
  }, [data]);

  return (
    <CatalogContext.Provider value={{ status, version }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  return useContext(CatalogContext);
}
