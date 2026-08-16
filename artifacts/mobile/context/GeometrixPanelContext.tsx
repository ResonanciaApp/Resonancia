import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Dimensions } from "react-native";
import { easeOutCubic } from "@/constants/motion";

export const GEOMETRIX_PANEL_W = Dimensions.get("window").width;

// Params que antes viajaban por la ruta /(tabs)/geometrix
export type GeometrixOpenParams = {
  load?: string;      // id de creación a cargar
  play?: string;      // "1" → reproducir al cargar
  new?: string;       // "1" → lienzo en blanco
  preloadId?: string; // geometría a precargar (desde Aprende)
};

type GeometrixPanelCtx = {
  isGeometrixOpen: boolean;
  /** true desde la primera apertura: el panel se monta lazy y queda montado */
  hasOpenedGeometrix: boolean;
  openGeometrix: (params?: GeometrixOpenParams) => void;
  closeGeometrix: () => void;
  /** Consume (y limpia) los params pendientes de la última apertura */
  consumePendingParams: () => GeometrixOpenParams | null;
  /** Se incrementa en cada openGeometrix: permite re-consumir params aunque el panel ya esté abierto */
  pendingVersion: number;
  panelAnim: Animated.Value;
};

const Ctx = createContext<GeometrixPanelCtx | null>(null);

export function GeometrixPanelProvider({ children }: { children: React.ReactNode }) {
  const [isGeometrixOpen, setIsGeometrixOpen] = useState(false);
  const [hasOpenedGeometrix, setHasOpenedGeometrix] = useState(false);
  const [pendingVersion, setPendingVersion] = useState(0);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const pendingRef = useRef<GeometrixOpenParams | null>(null);

  const animate = useCallback(
    (toOpen: boolean) => {
      panelAnim.stopAnimation();
      Animated.timing(panelAnim, {
        toValue: toOpen ? 1 : 0,
        duration: 320,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    },
    [panelAnim],
  );

  const hasMountedRef = useRef(false);

  const openGeometrix = useCallback((params?: GeometrixOpenParams) => {
    pendingRef.current = params ?? null;
    setPendingVersion((v) => v + 1);
    setHasOpenedGeometrix(true);
    setIsGeometrixOpen(true);
    if (hasMountedRef.current) {
      animate(true);
    } else {
      // Primera apertura: el screen (pesado) recién se está montando y bloquea
      // el hilo JS; si la animación arranca ya, se saltan frames y el panel
      // "aparece" de golpe. Diferir el inicio hasta después del montaje para
      // que la entrada dure lo mismo que las siguientes.
      hasMountedRef.current = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(() => animate(true)),
      );
    }
  }, [animate]);

  const closeGeometrix = useCallback(() => {
    setIsGeometrixOpen(false);
    animate(false);
  }, [animate]);

  const consumePendingParams = useCallback(() => {
    const p = pendingRef.current;
    pendingRef.current = null;
    return p;
  }, []);

  const value = React.useMemo(
    () => ({ isGeometrixOpen, hasOpenedGeometrix, openGeometrix, closeGeometrix, consumePendingParams, pendingVersion, panelAnim }),
    [isGeometrixOpen, hasOpenedGeometrix, openGeometrix, closeGeometrix, consumePendingParams, pendingVersion, panelAnim],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGeometrixPanel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGeometrixPanel must be used within GeometrixPanelProvider");
  return ctx;
}
