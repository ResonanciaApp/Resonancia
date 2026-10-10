import { Animated, BackHandler, useWindowDimensions } from "react-native";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "expo-router";
import {
  cancelAnimation,
  runOnJS,
  runOnUI,
  type SharedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { DURATION, easeOutCubic } from "@/constants/motion";
import {
  createDrawerTransitionController,
  normalizeRoutePath,
  drawerSpringConfig,
  type DrawerReadySource,
} from "@/lib/drawerGeometry";

export type LibraryTab = "playlists" | "mezclas" | "geometrix" | "historial" | "favoritos" | "resonadores";

export const DRAWER_OVERLAY_PARALLAX_X = -32;

/**
 * Seleccion iniciada desde el menu.
 * - layout: el destino es un overlay; el cierre empieza cuando su contenido
 *   confirma el layout real (acknowledgeDestinationReady("layout")).
 * - route: el destino es una ruta; el cierre empieza cuando cambia la ruta.
 * - afterClose: herramientas (Mezclador, Registro de animo) que abren su
 *   propia superficie solo despues de que el cierre termino de verdad.
 */
export type DrawerSelection =
  | { kind: "layout"; run: () => void; target?: string }
  | { kind: "route"; run: () => void; target?: string }
  | { kind: "afterClose"; run: () => void };

type DrawerCtx = {
  isOpen: boolean;
  /** Verdadero mientras la superficie frontal no esta en reposo (abierta,
   *  arrastrandose, preparando un destino o cerrando). Bloquea su contenido. */
  foregroundBlocked: boolean;
  open: () => void;
  close: (onClosed?: () => void) => void;
  /** Progreso unico y cancelable (Reanimated) del drawer estilo X. */
  drawerProgress: SharedValue<number>;
  /** Ancho actual de la ventana, compartido con los worklets. */
  drawerWidth: SharedValue<number>;
  drawerGestureVersion: SharedValue<number>;
  beginDrawerDrag: (version?: number) => void;
  settleDrawerDrag: (open: boolean, version?: number, velocityX?: number) => void;
  selectFromDrawer: (selection: DrawerSelection) => void;
  destinationRequest: number;
  acknowledgeDestinationReady: (source: DrawerReadySource, target?: string) => void;
  moodPickerRequest: number;
  requestMoodPicker: () => void;
  wallComposeRequest: number | null;
  requestWallCompose: () => void;
  consumeWallComposeRequest: (request: number) => void;
  /** True durante una navegacion iniciada desde el menu: la ruta destino se
   *  monta sin animacion propia dentro de la superficie que vuelve. */
  instantNav: boolean;
  libOpen: boolean;
  libraryParallax: Animated.Value;
  libraryInitialTab: LibraryTab | null;
  openLib: (initialTab?: LibraryTab) => void;
  openLibFromDrawer: (initialTab?: LibraryTab) => void;
  closeLib: () => void;
  libOpenedFromDrawer: boolean;
  libraryMixId: string | null;
  openLibraryMix: (id: string) => void;
  closeLibraryMix: () => void;
  overlayRoute: string | null;
  openOverlay: (route: string) => void;
  openOverlayFromDrawer: (route: string) => void;
  closeOverlay: () => void;
  overlayOpenedFromDrawer: boolean;
  /** Progreso compartido de paneles (Mezclador/Geometrix) abiertos con origen drawer. */
  drawerTransitionProgress: Animated.Value;
  chatUserId: number | null;
  openChat: (userId: number) => void;
  closeChat: () => void;
  overlayParallax: Animated.Value;
};

const Ctx = createContext<DrawerCtx | null>(null);
type MotionContext = Pick<DrawerCtx, "drawerProgress" | "drawerWidth" | "drawerGestureVersion" | "beginDrawerDrag" | "settleDrawerDrag">;
const MotionCtx = createContext<MotionContext | null>(null);
const HomeCtx = createContext<Pick<DrawerCtx, "open" | "moodPickerRequest"> | null>(null);
type DestinationContext = Pick<DrawerCtx,
  "instantNav" | "overlayParallax" | "drawerTransitionProgress" |
  "libOpen" | "libraryInitialTab" | "libOpenedFromDrawer" | "closeLib" |
  "libraryMixId" | "closeLibraryMix" | "overlayRoute" | "overlayOpenedFromDrawer" |
  "closeOverlay" | "chatUserId" | "closeChat" | "destinationRequest" | "acknowledgeDestinationReady"
> & { closeDrawerIfBlocked: () => void };
const DestinationCtx = createContext<DestinationContext | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [foregroundBlocked, setForegroundBlockedState] = useState(false);
  const foregroundBlockedRef = useRef(false);
  const setForegroundBlocked = useCallback((value: boolean) => {
    foregroundBlockedRef.current = value;
    setForegroundBlockedState(value);
  }, []);
  const [moodPickerRequest, setMoodPickerRequest] = useState(0);
  const [wallComposeRequest, setWallComposeRequest] = useState<number | null>(null);
  const [instantNav, setInstantNav] = useState(false);
  const [destinationRequest, setDestinationRequest] = useState(0);
  const drawerProgress = useSharedValue(0);
  const drawerWidth = useSharedValue(width);
  const drawerGestureVersion = useSharedValue(0);
  const controller = useRef(createDrawerTransitionController()).current;
  const afterSettle = useRef<{ token: number; callback?: () => void } | null>(null);
  const gestureSettle = useRef<{ token: number; version: number } | null>(null);
  const isOpenRef = useRef(false);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    drawerWidth.value = width;
  }, [drawerWidth, width]);

  const setOpenState = useCallback((value: boolean) => {
    isOpenRef.current = value;
    setIsOpen(value);
  }, []);

  const finishAnimation = useCallback((token: number, target: number, version: number) => {
    if (version !== drawerGestureVersion.value) return;
    if (!controller.isCurrentAnimation(token)) return;
    if (target === 0) setForegroundBlocked(false);
    const pending = afterSettle.current;
    afterSettle.current = null;
    if (pending && pending.token === token) pending.callback?.();
  }, [controller, drawerGestureVersion]);

  // Una sola animacion en vuelo: cada inicio invalida el callback anterior,
  // asi un cierre interrumpido nunca ejecuta su accion obsoleta.
  const animateTo = useCallback((target: 0 | 1, callback?: () => void) => {
    const token = controller.beginAnimation();
    afterSettle.current = { token, callback };
    runOnUI((destination: 0 | 1, animationToken: number) => {
      "worklet";
      drawerGestureVersion.value += 1;
      const version = drawerGestureVersion.value;
      // Reanimated replaces the previous spring on this SAME shared value and
      // carries its velocity on reversal. No JS read/write of the position.
      drawerProgress.value = withSpring(
        destination,
        drawerSpringConfig(0, drawerWidth.value, destination, drawerProgress.value),
        (finished) => {
          if (finished && version === drawerGestureVersion.value) {
            runOnJS(finishAnimation)(animationToken, destination, version);
          }
        },
      );
    })(target, token);
  }, [controller, drawerGestureVersion, drawerProgress, drawerWidth, finishAnimation]);

  const open = useCallback(() => {
    controller.cancelSelection();
    setInstantNav(false);
    setForegroundBlocked(true);
    setOpenState(true);
    animateTo(1);
  }, [animateTo, controller, drawerGestureVersion, setOpenState]);

  const closeInternal = useCallback((onClosed?: () => void) => {
    setOpenState(false);
    animateTo(0, onClosed);
  }, [animateTo, setOpenState]);

  const close = useCallback((onClosed?: () => void) => {
    controller.cancelSelection();
    closeInternal(() => {
      setInstantNav(false);
      // Pressable puede pasar su evento: solo se ejecutan callbacks reales.
      if (typeof onClosed === "function") onClosed();
    });
  }, [closeInternal, controller]);

  // Tools can abort a pending layout/return on Android Back without
  // subscribing to per-transition flags or starting a redundant zero spring.
  const closeDrawerIfBlocked = useCallback(() => {
    if (foregroundBlockedRef.current) close();
  }, [close]);

  const beginDrawerDrag = useCallback((version?: number) => {
    if (version !== undefined && version !== drawerGestureVersion.value) return;
    controller.cancelSelection();
    controller.beginAnimation();
    afterSettle.current = null;
    gestureSettle.current = null;
    // The worklet already stopped timing before touching the progress.
    // Do not mount a touch shield (or rerender Inicio) underneath an active finger.
  }, [controller, drawerGestureVersion, drawerProgress]);

  const prepareGestureSettle = useCallback((target: 0 | 1, version: number) => {
    if (version !== drawerGestureVersion.value) return;
    controller.cancelSelection();
    const token = controller.beginAnimation();
    gestureSettle.current = { token, version };
    afterSettle.current = { token };
    setInstantNav(false);
    setForegroundBlocked(true);
    setOpenState(target === 1);
  }, [controller, drawerGestureVersion, setForegroundBlocked, setOpenState]);

  const finishGestureSettle = useCallback((target: 0 | 1, version: number) => {
    const pending = gestureSettle.current;
    if (!pending || pending.version !== version) return;
    finishAnimation(pending.token, target, version);
  }, [finishAnimation]);

  const settleDrawerDrag = useCallback((shouldOpen: boolean, version?: number, velocityX = 0) => {
    "worklet";
    const generation = version ?? drawerGestureVersion.value;
    if (generation !== drawerGestureVersion.value) return;
    const target = shouldOpen ? 1 : 0;
    cancelAnimation(drawerProgress);
    // Start settling here on UI; JS only publishes coarse state after release.
    runOnJS(prepareGestureSettle)(target, generation);
    drawerProgress.value = withSpring(target, drawerSpringConfig(velocityX, drawerWidth.value, target, drawerProgress.value), (finished) => {
      if (finished && generation === drawerGestureVersion.value) {
        runOnJS(finishGestureSettle)(target, generation);
      }
    });
  }, [drawerGestureVersion, drawerProgress, drawerWidth, finishGestureSettle, prepareGestureSettle]);

  const acknowledgeDestinationReady = useCallback((source: DrawerReadySource, target?: string) => {
    const token = controller.acknowledge(source, target);
    if (token === null) return;
    const version = drawerGestureVersion.value;
    // Dos frames tras la confirmacion: el destino ya pinto antes de que la
    // superficie empiece a volver (las rutas confirman al cambiar pathname).
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!controller.isCurrentSelection(token) || version !== drawerGestureVersion.value) return;
      closeInternal(() => setInstantNav(false));
    }));
  }, [closeInternal, controller, drawerGestureVersion]);

  const selectFromDrawer = useCallback((selection: DrawerSelection) => {
    if (!isOpenRef.current) return; // evita selecciones repetidas
    runOnUI(() => {
      "worklet";
      drawerGestureVersion.value += 1;
      cancelAnimation(drawerProgress);
    })();
    if (selection.kind === "afterClose") {
      const token = controller.cancelSelection();
      closeInternal(() => {
        setInstantNav(false);
        requestAnimationFrame(() => {
          if (controller.isCurrentSelection(token)) selection.run();
        });
      });
      return;
    }
    setOpenState(false);
    const token = controller.beginSelection(selection.kind, selection.kind === "layout" ? selection.target : undefined);
    if (selection.kind === "layout") {
      setDestinationRequest(token);
      selection.run();
      return;
    }
    setInstantNav(true);
    requestAnimationFrame(() => {
      if (!controller.isPendingSelection(token)) return;
      if (
        selection.target
        && normalizeRoutePath(selection.target) === normalizeRoutePath(pathnameRef.current)
      ) {
        acknowledgeDestinationReady("route");
        return;
      }
      selection.run();
    });
  }, [acknowledgeDestinationReady, closeInternal, controller, drawerGestureVersion, drawerProgress, setOpenState]);

  // La ruta real cambio: el destino ya esta montado en la superficie frontal.
  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    acknowledgeDestinationReady("route");
  }, [acknowledgeDestinationReady, pathname]);

  // Atras tiene prioridad mientras la superficie no esta en reposo, incluida
  // una seleccion pendiente (isOpen ya es false): cancela y cierra, nunca
  // deja el progreso detenido en 1.
  useEffect(() => {
    if (!foregroundBlocked) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      close();
      return true;
    });
    return () => subscription.remove();
  }, [close, foregroundBlocked]);

  useEffect(() => () => {
    controller.beginAnimation();
    cancelAnimation(drawerProgress);
  }, [controller, drawerProgress]);

  const requestMoodPicker = useCallback(() => {
    setMoodPickerRequest((request) => request + 1);
  }, []);
  const requestWallCompose = useCallback(() => {
    setWallComposeRequest((request) => (request ?? 0) + 1);
  }, []);
  const consumeWallComposeRequest = useCallback((request: number) => {
    setWallComposeRequest((current) => current === request ? null : current);
  }, []);

  const [libOpen, setLibOpen] = useState(false);
  const drawerTransitionProgress = useRef(new Animated.Value(0)).current;
  const libraryParallax = useRef(new Animated.Value(0)).current;
  const [libOpenedFromDrawer, setLibOpenedFromDrawer] = useState(false);
  const [libraryInitialTab, setLibraryInitialTab] = useState<LibraryTab | null>(null);
  const openLib = useCallback((initialTab?: LibraryTab) => {
    setLibraryInitialTab(initialTab ?? null);
    setLibOpenedFromDrawer(false);
    setLibOpen(true);
  }, []);
  const openLibFromDrawer = useCallback((initialTab?: LibraryTab) => {
    setLibraryInitialTab(initialTab ?? null);
    setLibOpenedFromDrawer(true);
    setLibOpen(true);
  }, []);
  const closeLib = useCallback(() => {
    if (foregroundBlockedRef.current) close();
    setLibOpen(false);
    setLibraryInitialTab(null);
  }, [close]);
  const [libraryMixId, setLibraryMixId] = useState<string | null>(null);
  const openLibraryMix = useCallback((id: string) => setLibraryMixId(id), []);
  const closeLibraryMix = useCallback(() => setLibraryMixId(null), []);
  useEffect(() => {
    if (libOpenedFromDrawer) return;
    libraryParallax.stopAnimation();
    Animated.timing(libraryParallax, {
      toValue: libOpen ? 1 : 0,
      duration: DURATION.DRAWER,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [libOpen, libOpenedFromDrawer, libraryParallax]);

  const [overlayRoute, setOverlayRoute] = useState<string | null>(null);
  const [overlayOpenedFromDrawer, setOverlayOpenedFromDrawer] = useState(false);
  // Parallax de la pantalla de fondo solo para aperturas fuera del drawer.
  const overlayParallax = useRef(new Animated.Value(0)).current;
  const overlayOpen = Boolean(overlayRoute && !overlayOpenedFromDrawer);
  useEffect(() => {
    overlayParallax.stopAnimation();
    Animated.timing(overlayParallax, {
      toValue: overlayOpen ? 1 : 0,
      duration: DURATION.DRAWER,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [overlayOpen, overlayParallax]);
  const openOverlay = useCallback((route: string) => {
    setOverlayOpenedFromDrawer(false);
    setOverlayRoute(route);
  }, []);
  const openOverlayFromDrawer = useCallback((route: string) => {
    setOverlayOpenedFromDrawer(true);
    setOverlayRoute(route);
  }, []);
  const closeOverlay = useCallback(() => {
    if (foregroundBlockedRef.current) close();
    setOverlayRoute(null);
  }, [close]);
  const [chatUserId, setChatUserId] = useState<number | null>(null);
  const openChat = useCallback((userId: number) => setChatUserId(userId), []);
  const closeChat = useCallback(() => setChatUserId(null), []);

  const value = React.useMemo(
    () => ({ isOpen, foregroundBlocked, open, close, drawerProgress, drawerWidth, drawerGestureVersion, beginDrawerDrag, settleDrawerDrag, selectFromDrawer, destinationRequest, acknowledgeDestinationReady, moodPickerRequest, requestMoodPicker, wallComposeRequest, requestWallCompose, consumeWallComposeRequest, instantNav, libOpen, libraryParallax, libraryInitialTab, openLib, openLibFromDrawer, closeLib, libOpenedFromDrawer, libraryMixId, openLibraryMix, closeLibraryMix, overlayRoute, openOverlay, openOverlayFromDrawer, closeOverlay, overlayOpenedFromDrawer, overlayParallax, drawerTransitionProgress, chatUserId, openChat, closeChat }),
    [isOpen, foregroundBlocked, open, close, drawerProgress, drawerWidth, drawerGestureVersion, beginDrawerDrag, settleDrawerDrag, selectFromDrawer, destinationRequest, acknowledgeDestinationReady, moodPickerRequest, requestMoodPicker, wallComposeRequest, requestWallCompose, consumeWallComposeRequest, instantNav, libOpen, libraryParallax, libraryInitialTab, openLib, openLibFromDrawer, closeLib, libOpenedFromDrawer, libraryMixId, openLibraryMix, closeLibraryMix, overlayRoute, openOverlay, openOverlayFromDrawer, closeOverlay, overlayOpenedFromDrawer, overlayParallax, drawerTransitionProgress, chatUserId, openChat, closeChat],
  );

  // Opening/closing the drawer must not broadcast to navigation or panel providers.
  // Their close callbacks read the latest blocking flag without changing identity.
  const destinations = React.useMemo<DestinationContext>(() => ({
    instantNav, overlayParallax, drawerTransitionProgress,
    libOpen, libraryInitialTab, libOpenedFromDrawer, closeLib,
    libraryMixId, closeLibraryMix, overlayRoute, overlayOpenedFromDrawer, closeOverlay,
    chatUserId, closeChat, destinationRequest, acknowledgeDestinationReady, closeDrawerIfBlocked,
  }), [
    instantNav, overlayParallax, drawerTransitionProgress,
    libOpen, libraryInitialTab, libOpenedFromDrawer, closeLib,
    libraryMixId, closeLibraryMix, overlayRoute, overlayOpenedFromDrawer, closeOverlay,
    chatUserId, closeChat, destinationRequest, acknowledgeDestinationReady, closeDrawerIfBlocked,
  ]);
  const motion = React.useMemo(() => ({
    drawerProgress, drawerWidth, drawerGestureVersion, beginDrawerDrag, settleDrawerDrag,
  }), [drawerProgress, drawerWidth, drawerGestureVersion, beginDrawerDrag, settleDrawerDrag]);
  const home = React.useMemo(() => ({ open, moodPickerRequest }), [open, moodPickerRequest]);
  return <HomeCtx.Provider value={home}><MotionCtx.Provider value={motion}>
    <Ctx.Provider value={value}>
      <DestinationCtx.Provider value={destinations}>{children}</DestinationCtx.Provider>
    </Ctx.Provider>
  </MotionCtx.Provider></HomeCtx.Provider>;
}

export function useDrawerMotion() {
  const value = useContext(MotionCtx);
  if (!value) throw new Error("useDrawerMotion requires DrawerProvider");
  return value;
}

export function useHomeDrawer() {
  const value = useContext(HomeCtx);
  if (!value) throw new Error("useHomeDrawer requires DrawerProvider");
  return value;
}

export function useDrawerDestinations() {
  const value = useContext(DestinationCtx);
  if (!value) throw new Error("useDrawerDestinations requires DrawerProvider");
  return value;
}

export function useDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}
