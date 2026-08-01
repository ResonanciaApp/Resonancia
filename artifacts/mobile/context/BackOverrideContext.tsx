import React, { createContext, useContext } from "react";

/**
 * Cuando una pantalla se abre como overlay sobre el drawer, este contexto
 * provee la función de "volver" que cierra el overlay (en vez de router.back).
 * Fuera de un overlay queda null, y la pantalla usa su comportamiento normal.
 */
const BackOverrideCtx = createContext<(() => void) | null>(null);

export function BackOverrideProvider({
  onBack,
  children,
}: {
  onBack: () => void;
  children: React.ReactNode;
}) {
  return <BackOverrideCtx.Provider value={onBack}>{children}</BackOverrideCtx.Provider>;
}

/** Retorna la función de volver del overlay, o null si no hay overlay activo. */
export function useBackOverride() {
  return useContext(BackOverrideCtx);
}
