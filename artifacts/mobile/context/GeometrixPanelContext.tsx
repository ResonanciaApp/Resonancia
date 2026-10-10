import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Dimensions } from "react-native";
import { easeOutCubic } from "@/constants/motion";
import { useDrawerDestinations } from "@/context/DrawerContext";

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
  openedFromDrawer: boolean;
  /** true desde la primera apertura: el panel se monta lazy y queda montado */
  hasOpenedGeometrix: boolean;
  openGeometrix: (params?: GeometrixOpenParams) => void;
  openGeometrixFromDrawer: () => void;
  closeGeometrix: () => void;
  /** Consume (y limpia) los params pendientes de la última apertura */
  consumePendingParams: () => GeometrixOpenParams | null;
  /** Se incrementa en cada openGeometrix: permite re-consumir params aunque el panel ya esté abierto */
  pendingVersion: number;
  panelAnim: Animated.Value;
};

const Ctx = createContext<GeometrixPanelCtx | null>(null);

export function GeometrixPanelProvider({ children }: { children: React.ReactNode }) {
  const { drawerTransitionProgress } = useDrawerDestinations();
  const [isGeometrixOpen, setIsGeometrixOpen] = useState(false);
  const [openedFromDrawer, setOpenedFromDrawer] = useState(false);
  const [hasOpenedGeometrix, setHasOpenedGeometrix] = useState(false);
  const [pendingVersion, setPendingVersion] = useState(0);
  const panelAnim = useRef(new Animated.Value(0)).current;
  const pendingRef = useRef<GeometrixOpenParams | null>(null);
  const transitionToken = useRef(0);

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

  const openGeometrixWithOrigin = useCallback((params: GeometrixOpenParams | undefined, fromDrawer: boolean) => {
    const token = ++transitionToken.current;
    panelAnim.stopAnimation();
    drawerTransitionProgress.stopAnimation();
    pendingRef.current = params ?? null;
    setPendingVersion((v) => v + 1);
    setHasOpenedGeometrix(true);
    setIsGeometrixOpen(true);
    setOpenedFromDrawer(fromDrawer);
    const animateOpen = () => {
      if (token !== transitionToken.current) return;
      if (fromDrawer) {
        Animated.timing(drawerTransitionProgress, {
          toValue: 1,
          duration: 450,
          easing: easeOutCubic,
          useNativeDriver: true,
        }).start();
      } else {
        drawerTransitionProgress.setValue(0);
        animate(true);
      }
    };
    if (hasMountedRef.current) {
      animateOpen();
    } else {
      // Primera apertura: el screen (pesado) recién se está montando y bloquea
      // el hilo JS; si la animación arranca ya, se saltan frames y el panel
      // "aparece" de golpe. Diferir el inicio hasta después del montaje para
      // que la entrada dure lo mismo que las siguientes.
      hasMountedRef.current = true;
      requestAnimationFrame(() =>
        requestAnimationFrame(animateOpen),
      );
    }
  }, [animate, drawerTransitionProgress]);
  const openGeometrix = useCallback(
    (params?: GeometrixOpenParams) => openGeometrixWithOrigin(params, false),
    [openGeometrixWithOrigin],
  );
  const openGeometrixFromDrawer = useCallback(
    () => openGeometrixWithOrigin(undefined, true),
    [openGeometrixWithOrigin],
  );

  const closeGeometrix = useCallback(() => {
    const token = ++transitionToken.current;
    panelAnim.stopAnimation();
    drawerTransitionProgress.stopAnimation();
    if (openedFromDrawer) {
      Animated.timing(drawerTransitionProgress, {
        toValue: 0,
        duration: 450,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished || token !== transitionToken.current) return;
        setIsGeometrixOpen(false);
        setOpenedFromDrawer(false);
      });
    } else {
      setIsGeometrixOpen(false);
      animate(false);
    }
  }, [animate, drawerTransitionProgress, openedFromDrawer]);

  useEffect(() => {
    if (!isGeometrixOpen) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeGeometrix();
      return true;
    });
    return () => subscription.remove();
  }, [closeGeometrix, isGeometrixOpen]);

  const effectivePanelAnim = openedFromDrawer ? drawerTransitionProgress : panelAnim;

  const consumePendingParams = useCallback(() => {
    const p = pendingRef.current;
    pendingRef.current = null;
    return p;
  }, []);

  const value = React.useMemo(
    () => ({ isGeometrixOpen, openedFromDrawer, hasOpenedGeometrix, openGeometrix, openGeometrixFromDrawer, closeGeometrix, consumePendingParams, pendingVersion, panelAnim: effectivePanelAnim }),
    [isGeometrixOpen, openedFromDrawer, hasOpenedGeometrix, openGeometrix, openGeometrixFromDrawer, closeGeometrix, consumePendingParams, pendingVersion, effectivePanelAnim],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useGeometrixPanel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGeometrixPanel must be used within GeometrixPanelProvider");
  return ctx;
}
