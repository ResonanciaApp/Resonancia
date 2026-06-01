import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type DiarioSection = "aprendizaje" | "suenos" | "reflexiones" | "ideas";

export type DiarioEntry = {
  id: string;
  text: string;
  createdAt: string; // ISO string
};

const KEY = (section: DiarioSection) => `@diario_${section}`;

export function useDiario(section: DiarioSection) {
  const [entries, setEntries] = useState<DiarioEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY(section));
      setEntries(raw ? (JSON.parse(raw) as DiarioEntry[]) : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    load();
  }, [load]);

  // Lee siempre el estado persistido más reciente antes de mutar, para evitar
  // pisar datos cuando hay instancias paralelas del hook (lista + modal) que
  // todavía no terminaron su hidratación inicial.
  const readPersisted = useCallback(async (): Promise<DiarioEntry[]> => {
    try {
      const raw = await AsyncStorage.getItem(KEY(section));
      return raw ? (JSON.parse(raw) as DiarioEntry[]) : [];
    } catch {
      return [];
    }
  }, [section]);

  const persist = useCallback(
    async (next: DiarioEntry[]) => {
      setEntries(next);
      await AsyncStorage.setItem(KEY(section), JSON.stringify(next));
    },
    [section],
  );

  const saveEntry = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const entry: DiarioEntry = {
        id: Date.now().toString(),
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      const current = await readPersisted();
      await persist([entry, ...current]);
    },
    [readPersisted, persist],
  );

  const updateEntry = useCallback(
    async (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const current = await readPersisted();
      await persist(current.map((e) => (e.id === id ? { ...e, text: trimmed } : e)));
    },
    [readPersisted, persist],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const current = await readPersisted();
      await persist(current.filter((e) => e.id !== id));
    },
    [readPersisted, persist],
  );

  const deleteAll = useCallback(async () => {
    await persist([]);
  }, [persist]);

  return { entries, loading, saveEntry, updateEntry, deleteEntry, deleteAll, reload: load };
}
