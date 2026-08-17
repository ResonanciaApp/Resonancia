import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { dayKey } from "@/utils/stats";

/**
 * Devuelve la clave del día local actual ("YYYY-MM-DD") y se actualiza sola
 * al cruzar medianoche o al volver la app a primer plano. Úsala como
 * dependencia de cualquier useMemo de racha/semana para que no queden
 * pegados en "ayer" si la pantalla sigue montada.
 */
export function useDayRollover(): string {
  const [key, setKey] = useState(() => dayKey(new Date()));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      const now = new Date();
      const next = new Date(now);
      next.setHours(24, 0, 1, 0); // 00:00:01 del día siguiente
      timer = setTimeout(() => {
        setKey(dayKey(new Date()));
        schedule();
      }, next.getTime() - now.getTime());
    };
    schedule();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") setKey(dayKey(new Date()));
    });

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return key;
}
