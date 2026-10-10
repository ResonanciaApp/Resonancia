import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, BackHandler, Dimensions } from "react-native";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { stopSessionPlayback } from "@/context/audioBridge";
import { useDrawerDestinations } from "@/context/DrawerContext";

export const MIXER_PANEL_W = Dimensions.get("window").width;

type MixerPanelCtx = {
  isMixerOpen: boolean;
  openedFromDrawer: boolean;
  openMixer: () => void;
  openMixerFromDrawer: () => void;
  closeMixer: () => void;
  panelAnim: Animated.Value;
};

const Ctx = createContext<MixerPanelCtx | null>(null);

export function MixerPanelProvider({ children }: { children: React.ReactNode }) {
  const { drawerTransitionProgress, closeDrawerIfBlocked } = useDrawerDestinations();
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const [openedFromDrawer, setOpenedFromDrawer] = useState(false);
  const panelAnim = useRef(new Animated.Value(0)).current;
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

  const openMixerWithOrigin = useCallback((fromDrawer: boolean) => {
    ++transitionToken.current;
    panelAnim.stopAnimation();
    drawerTransitionProgress.stopAnimation();
    // Abrir el Mezclador es un cambio de contexto: la sesión previa no debe
    // quedar sonando ni mantener su miniplayer debajo/dentro del drawer.
    stopSessionPlayback();
    setOpenedFromDrawer(fromDrawer);
    setIsMixerOpen(true);
    if (fromDrawer) {
      // The panel is ready inside DrawerForeground before its return starts.
      // DrawerContext owns that motion; do not run a second lateral entrance.
      panelAnim.setValue(1);
    } else {
      drawerTransitionProgress.setValue(0);
      animate(true);
    }
  }, [animate, drawerTransitionProgress, panelAnim]);
  const openMixer = useCallback(() => openMixerWithOrigin(false), [openMixerWithOrigin]);
  const openMixerFromDrawer = useCallback(() => openMixerWithOrigin(true), [openMixerWithOrigin]);

  const closeMixer = useCallback(() => {
    ++transitionToken.current;
    panelAnim.stopAnimation();
    drawerTransitionProgress.stopAnimation();
    if (openedFromDrawer) {
      panelAnim.setValue(0);
      setIsMixerOpen(false);
      setOpenedFromDrawer(false);
      closeDrawerIfBlocked();
    } else {
      setIsMixerOpen(false);
      animate(false);
    }
  }, [animate, closeDrawerIfBlocked, drawerTransitionProgress, openedFromDrawer, panelAnim]);

  useEffect(() => {
    if (!isMixerOpen) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeMixer();
      return true;
    });
    return () => subscription.remove();
  }, [closeMixer, isMixerOpen]);

  const value = React.useMemo(
    () => ({ isMixerOpen, openedFromDrawer, openMixer, openMixerFromDrawer, closeMixer, panelAnim }),
    [isMixerOpen, openedFromDrawer, openMixer, openMixerFromDrawer, closeMixer, panelAnim],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMixerPanel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMixerPanel must be used within MixerPanelProvider");
  return ctx;
}
