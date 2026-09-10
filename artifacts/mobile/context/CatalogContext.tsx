/**
 * CatalogContext — lee el catálogo (categorías, sesiones, metadata de audio) del
 * servidor y lo hidrata in-place sobre los arrays bundleados (SESSIONS /
 * CATEGORIES), conservando los assets locales (image/audio resueltos por id).
 * ─────────────────────────────────────────────────────────────────
 * Offline-first:
 * 1. Los datos bundleados ya son válidos al arrancar (paridad 1:1 con el seed).
 * 2. Al montar, se aplica el último snapshot cacheado en AsyncStorage (rápido,
 *    sin red).
 * 3. En paralelo se pide GET /catalog; al responder se hidrata in-place como
 *    snapshot autoritativo, se cachea y se incrementa `version`.
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
  HOME_PLAYLISTS,
  PLAYLIST_CAROUSELS,
  PLAYLISTS,
  type EditorialPlaylist,
  type PlaylistCarouselSnapshot,
  type PlaylistSnapshot,
} from "@/data/playlists";

// v3 invalida snapshots que todavía podían contener sesiones retiradas.
const CACHE_KEY = "cdc_catalog_snapshot_v3";

type CatalogStatus = "bundled" | "cached" | "remote";

type CatalogContextValue = {
  /** Origen de los datos actualmente aplicados. */
  status: CatalogStatus;
  /** Se incrementa cada vez que se aplica un snapshot nuevo (cache o red). */
  version: number;
  /** Playlists curatoriales públicas; nunca contiene las playlists privadas. */
  editorialPlaylists: EditorialPlaylist[];
  /** Alias legado de Inicio: solo showOnHome y máximo cuatro. */
  homeEditorialPlaylists: EditorialPlaylist[];
  /** Definiciones publicadas de carruseles (los slugs se resuelven al renderizar). */
  editorialPlaylistCarousels: PlaylistCarouselSnapshot[];
};

const CatalogContext = createContext<CatalogContextValue>({
  status: "bundled",
  version: 0,
  editorialPlaylists: PLAYLISTS,
  homeEditorialPlaylists: HOME_PLAYLISTS,
  editorialPlaylistCarousels: PLAYLIST_CAROUSELS,
});

type CatalogSnapshot = {
  categories: CatalogCategorySnapshot[];
  sessions: CatalogSessionSnapshot[];
  playlists?: PlaylistSnapshot[];
  homePlaylists?: PlaylistSnapshot[];
  /**
   * Optional only for compatibility with snapshots created before named
   * carousels existed.  An explicit [] is authoritative and must be kept.
   */
  playlistCarousels?: PlaylistCarouselSnapshot[];
};

function hydrate(snapshot: CatalogSnapshot): void {
  applyCategoriesSnapshot(snapshot.categories);
  applyCatalogSnapshot(snapshot.sessions);
  if (snapshot.playlists) {
    applyPlaylistsSnapshot(
      snapshot.playlists,
      snapshot.homePlaylists,
      snapshot.playlistCarousels,
    );
  }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<CatalogStatus>("bundled");
  const [version, setVersion] = useState(0);
  const lastSignature = useRef<string | null>(null);
  const remoteApplied = useRef(false);

  // 1) Aplicar el snapshot cacheado al montar (offline / arranque rápido).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (!raw || cancelled || remoteApplied.current) return;
        const parsed = JSON.parse(raw) as CatalogResponse & CatalogSnapshot;
        if (!parsed?.categories || !parsed?.sessions) return;
        if (remoteApplied.current || cancelled) return;
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
    // Mark the network response before hydrating so a slower cache read can
    // never overwrite a valid remote response with stale editorial state.
    remoteApplied.current = true;
    const snapshot = data as CatalogResponse & CatalogSnapshot;
    const signature = JSON.stringify(snapshot);
    if (signature === lastSignature.current) {
      setStatus("remote");
      return;
    }
    hydrate(snapshot);
    lastSignature.current = signature;
    setStatus("remote");
    setVersion((v) => v + 1);
    AsyncStorage.setItem(CACHE_KEY, signature).catch(() => {
      // Si falla el guardado del cache, el próximo arranque usa lo bundleado.
    });
  }, [data]);

  return (
    <CatalogContext.Provider
      value={{
        status,
        version,
        editorialPlaylists: PLAYLISTS,
        homeEditorialPlaylists: HOME_PLAYLISTS,
        editorialPlaylistCarousels: PLAYLIST_CAROUSELS,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog(): CatalogContextValue {
  return useContext(CatalogContext);
}
