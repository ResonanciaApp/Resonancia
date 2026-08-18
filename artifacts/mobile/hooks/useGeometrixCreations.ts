import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { getMyLibrary, setMyLibrary } from "@workspace/api-client-react";

import type { GeometrixCreation } from "@/data/geometrix-creations";

const KEY = "@geometrix_creations";
// Limpieza one-shot pedida por el usuario (jul 2026): borra todas las
// composiciones guardadas una única vez por dispositivo.
const WIPE_FLAG = "@geometrix_creations_wiped_v1";
// Marca de primera sincronización con la nube (unión una sola vez por dispositivo).
const CLOUD_SYNC_FLAG = "@geometrix_creations_cloud_sync_v1";

// ── Respaldo en la nube ───────────────────────────────────────────────────────
// Push debounced a nivel de módulo (varias instancias del hook comparten timer).
// Al disparar: espera la restauración inicial y relee storage, de modo que
// nunca sube un snapshot viejo por encima de la copia de la nube.
let cloudPushTimer: ReturnType<typeof setTimeout> | null = null;
function pushToCloud() {
  if (cloudPushTimer) clearTimeout(cloudPushTimer);
  cloudPushTimer = setTimeout(async () => {
    try {
      await restoreFromCloudOnce();
      const raw = await AsyncStorage.getItem(KEY);
      const latest: GeometrixCreation[] = raw ? JSON.parse(raw) : [];
      await setMyLibrary({ geometrixCreations: latest });
    } catch {
      // Sin sesión o sin red: silencioso, se reintenta en el próximo cambio
    }
  }, 1500);
}

// Primera sync: unión con la nube, deduplicada por promesa compartida para que
// instancias paralelas del hook no la ejecuten dos veces.
let cloudRestorePromise: Promise<void> | null = null;
function restoreFromCloudOnce(): Promise<void> {
  if (!cloudRestorePromise) {
    cloudRestorePromise = (async () => {
      try {
        const synced = await AsyncStorage.getItem(CLOUD_SYNC_FLAG);
        if (synced) return;
        const snap = await getMyLibrary();
        const server = (snap.geometrixCreations ?? []) as GeometrixCreation[];
        if (server.length > 0) {
          const raw = await AsyncStorage.getItem(KEY);
          const local: GeometrixCreation[] = raw ? JSON.parse(raw) : [];
          const localIds = new Set(local.map((c) => c.id));
          const merged = [...local, ...server.filter((c) => c && !localIds.has(c.id))];
          await AsyncStorage.setItem(KEY, JSON.stringify(merged));
          notifyCount(merged.length);
          // Subir la unión para que la nube converja aunque un push temprano
          // hubiera enviado solo lo local.
          if (local.length > 0) {
            setMyLibrary({ geometrixCreations: merged }).catch(() => {});
          }
        }
        await AsyncStorage.setItem(CLOUD_SYNC_FLAG, "1");
      } catch {
        // Sin sesión o sin red: permitir reintento en el próximo load
        cloudRestorePromise = null;
      }
    })();
  }
  return cloudRestorePromise;
}

// ── Señal cross-instancia ─────────────────────────────────────────────────────
// Cada instancia del hook mantiene su propio estado; este emitter avisa a
// suscriptores externos (p. ej. el motor de hitos) cada vez que ALGUNA
// instancia persiste, con el conteo actualizado.
type CountListener = (count: number) => void;
const countListeners = new Set<CountListener>();

export function subscribeGeometrixCount(fn: CountListener): () => void {
  countListeners.add(fn);
  return () => countListeners.delete(fn);
}

function notifyCount(count: number) {
  for (const fn of countListeners) fn(count);
}

/** Conteo directo desde storage (para hidratación inicial del motor de hitos). */
export async function readGeometrixCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as unknown[]).length : 0;
  } catch {
    return 0;
  }
}

async function wipeOnce() {
  try {
    const done = await AsyncStorage.getItem(WIPE_FLAG);
    if (done) return;
    await AsyncStorage.removeItem(KEY);
    await AsyncStorage.setItem(WIPE_FLAG, "1");
  } catch {
    // sin conexión al storage: se reintenta en el próximo load
  }
}

/** Campos que aporta el editor al guardar (el resto los completa el hook). */
export type NewCreation = Pick<
  GeometrixCreation,
  "name" | "active" | "master" | "settings" | "audio"
>;

/**
 * Persistencia local (AsyncStorage) de las composiciones de Geometrix.
 * Modelado sobre `useDiario`: read-modify-write para tolerar instancias
 * paralelas del hook (editor + pantalla "Mis creaciones") que aún no
 * terminaron su hidratación inicial.
 */
export function useGeometrixCreations() {
  const [creations, setCreations] = useState<GeometrixCreation[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      await wipeOnce();
      await restoreFromCloudOnce();
      const raw = await AsyncStorage.getItem(KEY);
      setCreations(raw ? (JSON.parse(raw) as GeometrixCreation[]) : []);
    } catch {
      setCreations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const readPersisted = useCallback(async (): Promise<GeometrixCreation[]> => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as GeometrixCreation[]) : [];
    } catch {
      return [];
    }
  }, []);

  const persist = useCallback(async (next: GeometrixCreation[]) => {
    setCreations(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    notifyCount(next.length);
    pushToCloud();
  }, []);

  /** Guarda una composición nueva (la más reciente queda primera). */
  const saveCreation = useCallback(
    async (input: NewCreation): Promise<GeometrixCreation> => {
      const now = new Date().toISOString();
      const creation: GeometrixCreation = {
        id: Date.now().toString(),
        liked: false,
        createdAt: now,
        updatedAt: now,
        ...input,
        name: input.name.trim() || "Composición sin nombre",
      };
      const current = await readPersisted();
      await persist([creation, ...current]);
      return creation;
    },
    [readPersisted, persist],
  );

  /** Sobrescribe los datos de una composición existente (reordena al frente). */
  const updateCreation = useCallback(
    async (id: string, patch: Partial<NewCreation>) => {
      const current = await readPersisted();
      const now = new Date().toISOString();
      const next = current.map((c) =>
        c.id === id ? { ...c, ...patch, updatedAt: now } : c,
      );
      await persist(next);
    },
    [readPersisted, persist],
  );

  const renameCreation = useCallback(
    async (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const current = await readPersisted();
      await persist(
        current.map((c) =>
          c.id === id ? { ...c, name: trimmed, updatedAt: new Date().toISOString() } : c,
        ),
      );
    },
    [readPersisted, persist],
  );

  const toggleLiked = useCallback(
    async (id: string) => {
      const current = await readPersisted();
      await persist(current.map((c) => (c.id === id ? { ...c, liked: !c.liked } : c)));
    },
    [readPersisted, persist],
  );

  const deleteCreation = useCallback(
    async (id: string) => {
      const current = await readPersisted();
      await persist(current.filter((c) => c.id !== id));
    },
    [readPersisted, persist],
  );

  /** Lee una composición por id desde el almacenamiento (no del estado). */
  const getCreation = useCallback(
    async (id: string): Promise<GeometrixCreation | undefined> => {
      const current = await readPersisted();
      return current.find((c) => c.id === id);
    },
    [readPersisted],
  );

  return {
    creations,
    loading,
    saveCreation,
    updateCreation,
    renameCreation,
    toggleLiked,
    deleteCreation,
    getCreation,
    reload: load,
  };
}
