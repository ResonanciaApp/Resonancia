import { Dimensions } from "react-native";
import { Animated, Easing } from "react-native";
import { usePathname } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export const DRAWER_W = Math.min(Dimensions.get("window").width * 0.78, 300);
export const DRAWER_PUSH = DRAWER_W + 50;

type DrawerCtx = {
  isOpen: boolean;
  instant: boolean;
  open: () => void;
  close: () => void;
  drawerAnim: Animated.Value;
};

const Ctx = createContext<DrawerCtx | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const reopenOnHome = useRef(false);
  const drawerAnim = useRef(new Animated.Value(0)).current;

  const pathname = usePathname();
  const prevPath = useRef(pathname);

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
        setInstant(true);
        setIsOpen(true);
      }, 80);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => {
    if (isOpen) {
      if (instant) {
        drawerAnim.setValue(1);
        return;
      }
      // Apertura: timing con ease-out cúbico — arranque rápido, llega suave
      Animated.timing(drawerAnim, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      // Cierre: timing con ease-in cúbico — sale suave, termina decisivo
      Animated.timing(drawerAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, instant, drawerAnim]);

  const open = useCallback(() => {
    setInstant(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInstant(false);
  }, []);

  const value = React.useMemo(
    () => ({ isOpen, instant, open, close, drawerAnim }),
    [isOpen, instant, open, close, drawerAnim],
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
