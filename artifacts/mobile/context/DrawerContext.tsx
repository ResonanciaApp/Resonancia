import { Dimensions, Animated } from "react-native";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { DURATION, easeOutCubic } from "@/constants/motion";

export type LibraryTab = "playlists" | "mezclas" | "geometrix" | "historial" | "favoritos" | "resonadores";

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
  /** Overlay de Biblioteca que se desliza SOBRE el drawer (el drawer queda
   *  abierto debajo; al cerrarse el overlay, el drawer sigue visible). */
  libOpen: boolean;
  /** Parallax dedicado para mantener la tab bar fija sobre Biblioteca. */
  libraryParallax: Animated.Value;
  libraryInitialTab: LibraryTab | null;
  openLib: (initialTab?: LibraryTab) => void;
  closeLib: () => void;
  /** Overlay genérico para otras pantallas del drawer (diario, amigos, etc.) */
  overlayRoute: string | null;
  openOverlay: (route: string) => void;
  closeOverlay: () => void;
  /** Chat overlay que se desliza SOBRE el overlay de amigos (queda abierto debajo). */
  chatUserId: number | null;
  openChat: (userId: number) => void;
  closeChat: () => void;
  overlayParallax: Animated.Value;
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
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
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

  const [libOpen, setLibOpen] = useState(false);
  const libraryParallax = useRef(new Animated.Value(0)).current;
  const [libraryInitialTab, setLibraryInitialTab] = useState<LibraryTab | null>(null);
  const openLib = useCallback((initialTab?: LibraryTab) => {
    setLibraryInitialTab(initialTab ?? null);
    setLibOpen(true);
  }, []);
  const closeLib = useCallback(() => {
    setLibOpen(false);
    setLibraryInitialTab(null);
  }, []);
  useEffect(() => {
    libraryParallax.stopAnimation();
    Animated.timing(libraryParallax, {
      toValue: libOpen ? 1 : 0,
      duration: 320,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [libOpen, libraryParallax]);

  const [overlayRoute, setOverlayRoute] = useState<string | null>(null);
  // Parallax: el drawer y la pantalla que queda detrás se corren un poco al
  // abrir cualquiera de los overlays del drawer, incluida Biblioteca.
  const overlayParallax = useRef(new Animated.Value(0)).current;
  const overlayOpen = Boolean(overlayRoute || libOpen);
  useEffect(() => {
    overlayParallax.stopAnimation();
    Animated.timing(overlayParallax, {
      toValue: overlayOpen ? 1 : 0,
      duration: 320,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [overlayOpen, overlayParallax]);
  const openOverlay = useCallback((route: string) => setOverlayRoute(route), []);
  const closeOverlay = useCallback(() => setOverlayRoute(null), []);
  const [chatUserId, setChatUserId] = useState<number | null>(null);
  const openChat = useCallback((userId: number) => setChatUserId(userId), []);
  const closeChat = useCallback(() => setChatUserId(null), []);

  const value = React.useMemo(
    () => ({ isOpen, open, close, drawerAnim, instantNav, markInstantNav, libOpen, libraryParallax, libraryInitialTab, openLib, closeLib, overlayRoute, openOverlay, closeOverlay, overlayParallax, chatUserId, openChat, closeChat }),
    [isOpen, open, close, drawerAnim, instantNav, markInstantNav, libOpen, libraryParallax, libraryInitialTab, openLib, closeLib, overlayRoute, openOverlay, closeOverlay, overlayParallax, chatUserId, openChat, closeChat],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}
