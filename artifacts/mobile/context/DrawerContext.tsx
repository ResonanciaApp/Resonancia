import { Dimensions } from "react-native";
import { Animated, Easing } from "react-native";
import React, { createContext, useCallback, useContext, useRef, useState } from "react";

export const DRAWER_W = Math.min(Dimensions.get("window").width * 0.78, 300);
export const DRAWER_PUSH = DRAWER_W + 50;

type DrawerCtx = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  drawerAnim: Animated.Value;
};

const Ctx = createContext<DrawerCtx | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  // Animación imperativa: cancela cualquier animación en vuelo antes de empezar,
  // así un cierre a medio camino no compite con una apertura (evita parpadeos).
  const animate = useCallback(
    (toOpen: boolean) => {
      drawerAnim.stopAnimation();
      Animated.timing(drawerAnim, {
        toValue: toOpen ? 1 : 0,
        duration: toOpen ? 260 : 220,
        easing: toOpen ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [drawerAnim],
  );

  const open = useCallback(() => {
    setIsOpen(true);
    animate(true);
  }, [animate]);

  const close = useCallback(() => {
    setIsOpen(false);
    animate(false);
  }, [animate]);

  const value = React.useMemo(
    () => ({ isOpen, open, close, drawerAnim }),
    [isOpen, open, close, drawerAnim],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}
