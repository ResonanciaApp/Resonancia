import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated } from "react-native";
import { DURATION, easeOutCubic } from "@/constants/motion";

export type OverlayEntry = { key: number; route: string };

type CategoryOverlayCtx = {
  /** Pila de rutas abiertas como overlay (la última es la visible arriba). */
  stack: OverlayEntry[];
  /** Ruta del tope de la pila (compat). */
  categoryRoute: string | null;
  /** Abre una ruta como overlay (se apila sobre las anteriores). */
  openCategory: (route: string) => void;
  /** Cierra el overlay del tope de la pila. */
  closeCategory: () => void;
  /** Cierra TODA la pila de overlays (p.ej. al cambiar de tab). */
  closeAllCategories: () => void;
  /** Profundidad animada de la pila (0, 1, 2…) para el parallax del fondo. */
  parallaxAnim: Animated.Value;
};

const Ctx = createContext<CategoryOverlayCtx | null>(null);

// Opener global registrado por el provider, para llamadores fuera del árbol
// (p.ej. DrawerMenu, que vive en el root layout).
let globalOpen: ((route: string) => void) | null = null;
export function openCategoryGlobal(route: string): boolean {
  if (!globalOpen) return false;
  globalOpen(route);
  return true;
}

export function CategoryOverlayProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<OverlayEntry[]>([]);
  const nextKey = useRef(1);
  const parallaxAnim = useRef(new Animated.Value(0)).current;

  // Sigue la profundidad de la pila con la misma curva que el slide de las capas.
  useEffect(() => {
    parallaxAnim.stopAnimation();
    Animated.timing(parallaxAnim, {
      toValue: stack.length,
      duration: DURATION.DRAWER,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [stack.length, parallaxAnim]);

  const openCategory = useCallback((route: string) => {
    setStack((prev) => {
      // Evitar duplicar la misma ruta que ya está en el tope.
      if (prev.length && prev[prev.length - 1].route === route) return prev;
      return [...prev, { key: nextKey.current++, route }];
    });
  }, []);

  const closeCategory = useCallback(() => {
    setStack((prev) => (prev.length ? prev.slice(0, -1) : prev));
  }, []);

  const closeAllCategories = useCallback(() => {
    setStack((prev) => (prev.length ? [] : prev));
  }, []);

  useEffect(() => {
    globalOpen = openCategory;
    return () => { if (globalOpen === openCategory) globalOpen = null; };
  }, [openCategory]);

  const categoryRoute = stack.length ? stack[stack.length - 1].route : null;

  const value = React.useMemo(
    () => ({ stack, categoryRoute, openCategory, closeCategory, closeAllCategories, parallaxAnim }),
    [stack, categoryRoute, openCategory, closeCategory, closeAllCategories, parallaxAnim],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCategoryOverlay() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCategoryOverlay must be used within CategoryOverlayProvider");
  return ctx;
}

/**
 * Variante segura para componentes compartidos que pueden montarse fuera del
 * provider (rutas root). Retorna null fuera de las tabs: en ese caso el
 * componente debe navegar con router.push como siempre.
 */
export function useCategoryOverlayOptional() {
  return useContext(Ctx);
}
