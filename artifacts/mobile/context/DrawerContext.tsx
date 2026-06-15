import { Dimensions } from "react-native";
import { Animated, Easing } from "react-native";
import { usePathname } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

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
  const reopenOnHome = useRef(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const pathname = usePathname();
  const prevPath = useRef(pathname);

  // Animación imperativa: cancela cualquier animación en vuelo antes de empezar,
  // así un cierre a medio camino no compite con una apertura (evita parpadeos).
  const animate = useCallback(
    (toOpen: boolean, instant: boolean) => {
      drawerAnim.stopAnimation();
      if (instant) {
        drawerAnim.setValue(toOpen ? 1 : 0);
        return;
      }
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
    animate(true, false);
  }, [animate]);

  const close = useCallback(() => {
    setIsOpen(false);
    animate(false, false);
  }, [animate]);

  // Reapertura al volver a una ruta de tabs (p. ej. tras navegar a "Amigos" y
  // retroceder). Aparece instantáneo, sin animación que compita con la transición
  // de pantalla.
  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = pathname;
    const isTabsRoute =
      pathname === "/" ||
      pathname === "" ||
      pathname === "/(tabs)" ||
      pathname.startsWith("/(tabs)/");
    if (reopenOnHome.current && isTabsRoute && prev !== pathname) {
      reopenOnHome.current = false;
      const t = setTimeout(() => {
        setIsOpen(true);
        animate(true, true);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [pathname, animate]);

  const value = React.useMemo(
    () => ({ isOpen, open, close, drawerAnim }),
    [isOpen, open, close, drawerAnim],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <ReopenFlagBridge setFlag={(v) => { reopenOnHome.current = v; }} />
    </Ctx.Provider>
  );
}

let _setReopenFlag: ((v: boolean) => void) | null = null;
function ReopenFlagBridge({ setFlag }: { setFlag: (v: boolean) => void }) {
  useEffect(() => {
    _setReopenFlag = setFlag;
    return () => { _setReopenFlag = null; };
  }, [setFlag]);
  return null;
}

export function markDrawerReopenOnHome() {
  _setReopenFlag?.(true);
}

export function useDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}
