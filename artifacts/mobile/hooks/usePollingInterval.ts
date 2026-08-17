import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

/**
 * Intervalo de sondeo (refetchInterval) que se pausa cuando la pantalla que
 * lo usa deja de estar en foco. Las tabs y overlays quedan montados al
 * navegar, así que un refetchInterval fijo sigue sondeando en pantallas que
 * el usuario ni está mirando (gasto de batería/datos — informe de auditoría).
 *
 * El sondeo en segundo plano (app minimizada) ya lo pausa el focusManager
 * global cableado a AppState en app/_layout.tsx.
 */
export function usePollingInterval(ms: number): number | false {
  const [focused, setFocused] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );
  return focused ? ms : false;
}
