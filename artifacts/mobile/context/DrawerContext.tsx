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
  /** True durante una navegación iniciada desde el menú: las pantallas destino
   *  del drawer entran SIN animación propia, así el único movimiento es el cierre
   *  del drawer (evita el "flash" de Inicio antes de que aparezca la página). */
  instantNav: boolean;
  /** Activa instantNav por un instante (auto-reset) justo antes de navegar. */
  markInstantNav: () => void;
};

const Ctx = createContext<DrawerCtx | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [instantNav, setInstantNav] = useState(false);
  const instantNavTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  // Marca la próxima navegación como instantánea (sin slide de la pantalla destino)
  // y se reinicia sola pasado el cierre del drawer, para que el "atrás" y las
  // navegaciones desde otros lados conserven su animación normal.
  const markInstantNav = useCallback(() => {
    setInstantNav(true);
    if (instantNavTimer.current) clearTimeout(instantNavTimer.current);
    instantNavTimer.current = setTimeout(() => setInstantNav(false), 450);
  }, []);

  // Animación imperativa: cancela cualquier animación en vuelo antes de empezar,
  // así un cierre a medio camino no compite con una apertura (evita parpadeos).
  const animate = useCallback(
    (toOpen: boolean) => {
      drawerAnim.stopAnimation();
      Animated.timing(drawerAnim, {
        toValue: toOpen ? 1 : 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
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
    () => ({ isOpen, open, close, drawerAnim, instantNav, markInstantNav }),
    [isOpen, open, close, drawerAnim, instantNav, markInstantNav],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}
