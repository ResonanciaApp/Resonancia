import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

export type DiarioSection = "aprendizaje" | "suenos" | "reflexiones";

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

  const saveEntry = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const entry: DiarioEntry = {
        id: Date.now().toString(),
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      const updated = [entry, ...entries];
      setEntries(updated);
      await AsyncStorage.setItem(KEY(section), JSON.stringify(updated));
    },
    [entries, section],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const updated = entries.filter((e) => e.id !== id);
      setEntries(updated);
      await AsyncStorage.setItem(KEY(section), JSON.stringify(updated));
    },
    [entries, section],
  );

  return { entries, loading, saveEntry, deleteEntry };
}
