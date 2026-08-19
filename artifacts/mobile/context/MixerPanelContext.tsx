import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Dimensions } from "react-native";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { stopSessionPlayback } from "@/context/audioBridge";

export const MIXER_PANEL_W = Dimensions.get("window").width;

type MixerPanelCtx = {
  isMixerOpen: boolean;
  openMixer: () => void;
  closeMixer: () => void;
  panelAnim: Animated.Value;
};

const Ctx = createContext<MixerPanelCtx | null>(null);

export function MixerPanelProvider({ children }: { children: React.ReactNode }) {
  const [isMixerOpen, setIsMixerOpen] = useState(false);
  const panelAnim = useRef(new Animated.Value(0)).current;

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

  const openMixer = useCallback(() => {
    // Abrir el Mezclador es un cambio de contexto: la sesión previa no debe
    // quedar sonando ni mantener su miniplayer debajo/dentro del drawer.
    stopSessionPlayback();
    setIsMixerOpen(true);
    animate(true);
  }, [animate]);

  const closeMixer = useCallback(() => {
    setIsMixerOpen(false);
    animate(false);
  }, [animate]);

  const value = React.useMemo(
    () => ({ isMixerOpen, openMixer, closeMixer, panelAnim }),
    [isMixerOpen, openMixer, closeMixer, panelAnim],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMixerPanel() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMixerPanel must be used within MixerPanelProvider");
  return ctx;
}
