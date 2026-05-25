import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "resonancia:grupos_creados";

export interface GrupoLocal {
  id: string;
  nombre: string;
  descripcion: string;
  privado: boolean;
  imageIdx: number | null;
  bienvenida: string;
  inviteCode: string;
  creadoEn: number;
}

export function useGrupos() {
  const [grupos, setGrupos] = useState<GrupoLocal[]>([]);

  const reload = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      setGrupos(raw ? (JSON.parse(raw) as GrupoLocal[]) : []);
    } catch {}
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const saveGrupo = useCallback(async (grupo: GrupoLocal) => {
    setGrupos((prev) => {
      const next = [grupo, ...prev.filter((g) => g.id !== grupo.id)];
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const deleteGrupo = useCallback(async (id: string) => {
    setGrupos((prev) => {
      const next = prev.filter((g) => g.id !== id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  return { grupos, reload, saveGrupo, deleteGrupo };
}
