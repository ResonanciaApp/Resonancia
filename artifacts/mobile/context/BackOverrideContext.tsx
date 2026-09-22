import React, { createContext, useContext } from "react";

/**
 * Cuando una pantalla se abre como overlay sobre el drawer, este contexto
 * provee la función de "volver" que cierra el overlay (en vez de router.back).
 * Fuera de un overlay queda null, y la pantalla usa su comportamiento normal.
 */
const BackOverrideCtx = createContext<(() => void) | null>(null);
const BackAfterCloseCtx = createContext<((callback: () => void) => void) | null>(null);

export function BackOverrideProvider({
  onBack,
  onBackAfterClose,
  children,
}: {
  onBack: () => void;
  onBackAfterClose?: (callback: () => void) => void;
  children: React.ReactNode;
}) {
  return (
    <BackOverrideCtx.Provider value={onBack}>
      <BackAfterCloseCtx.Provider value={onBackAfterClose ?? null}>
        {children}
      </BackAfterCloseCtx.Provider>
    </BackOverrideCtx.Provider>
  );
}

/** Retorna la función de volver del overlay, o null si no hay overlay activo. */
export function useBackOverride() {
  return useContext(BackOverrideCtx);
}

/** Cierra el overlay y ejecuta el callback solo al terminar la animación vigente. */
export function useBackAfterClose() {
  return useContext(BackAfterCloseCtx);
}
