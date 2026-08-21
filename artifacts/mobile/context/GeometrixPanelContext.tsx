import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
  /** Señal interna del layout: el contenedor pesado del panel ya terminó su primer montaje */
  markGeometrixPanelMounted: () => void;
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
  const deferredOpenRafRef = useRef<number | null>(null);
  const openGenerationRef = useRef(0);
  const panelMountedRef = useRef(false);
  const pendingInitialOpenRef = useRef(false);
  const isOpenRef = useRef(false);

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

  const cancelDeferredOpen = useCallback(() => {
    openGenerationRef.current += 1;
    if (deferredOpenRafRef.current !== null) {
      cancelAnimationFrame(deferredOpenRafRef.current);
      deferredOpenRafRef.current = null;
    }
  }, []);

  const scheduleDeferredOpen = useCallback(() => {
    cancelDeferredOpen();
    const generation = openGenerationRef.current;
    deferredOpenRafRef.current = requestAnimationFrame(() => {
      if (generation !== openGenerationRef.current || !isOpenRef.current) return;
      deferredOpenRafRef.current = requestAnimationFrame(() => {
        deferredOpenRafRef.current = null;
        if (generation !== openGenerationRef.current || !isOpenRef.current) return;
        animate(true);
      });
    });
  }, [animate, cancelDeferredOpen]);

  const markGeometrixPanelMounted = useCallback(() => {
    panelMountedRef.current = true;
    if (!pendingInitialOpenRef.current || !isOpenRef.current) return;
    pendingInitialOpenRef.current = false;
    scheduleDeferredOpen();
  }, [scheduleDeferredOpen]);

  const openGeometrix = useCallback((params?: GeometrixOpenParams) => {
    cancelDeferredOpen();
    pendingRef.current = params ?? null;
    setPendingVersion((v) => v + 1);
    setHasOpenedGeometrix(true);
    setIsGeometrixOpen(true);
    isOpenRef.current = true;
    if (panelMountedRef.current) {
      pendingInitialOpenRef.current = false;
      animate(true);
    } else {
      // Primera apertura: el screen (pesado) recién se está montando y bloquea
      // el hilo JS; si la animación arranca ya, se saltan frames y el panel
      // "aparece" de golpe. Diferir el inicio hasta después del montaje para
      // que la entrada dure lo mismo que las siguientes.
      pendingInitialOpenRef.current = true;
    }
  }, [animate, cancelDeferredOpen]);

  const closeGeometrix = useCallback(() => {
    isOpenRef.current = false;
    pendingInitialOpenRef.current = false;
    cancelDeferredOpen();
    setIsGeometrixOpen(false);
    animate(false);
  }, [animate, cancelDeferredOpen]);

  useEffect(() => {
    return () => {
      isOpenRef.current = false;
      pendingInitialOpenRef.current = false;
      cancelDeferredOpen();
      panelAnim.stopAnimation();
    };
  }, [cancelDeferredOpen, panelAnim]);

  const consumePendingParams = useCallback(() => {
    const p = pendingRef.current;
    pendingRef.current = null;
    return p;
  }, []);

  const value = React.useMemo(
    () => ({ isGeometrixOpen, hasOpenedGeometrix, openGeometrix, closeGeometrix, markGeometrixPanelMounted, consumePendingParams, pendingVersion, panelAnim }),
    [isGeometrixOpen, hasOpenedGeometrix, openGeometrix, closeGeometrix, markGeometrixPanelMounted, consumePendingParams, pendingVersion, panelAnim],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGeometrixPanel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGeometrixPanel must be used within GeometrixPanelProvider");
  return ctx;
}
