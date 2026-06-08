import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

import type { GeometrixCreation } from "@/data/geometrix-creations";

const KEY = "@geometrix_creations";

/** Campos que aporta el editor al guardar (el resto los completa el hook). */
export type NewCreation = Pick<
  GeometrixCreation,
  "name" | "active" | "master" | "settings" | "soloId" | "audio"
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
