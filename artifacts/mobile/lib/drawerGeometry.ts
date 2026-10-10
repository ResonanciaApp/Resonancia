/**
 * Geometria y controlador puro del drawer de Inicio estilo X.
 * Todo deriva de un unico progreso cancelable (0 cerrado, 1 abierto).
 * Las funciones de geometria son worklets: corren en el hilo de UI
 * (Reanimated) y tambien en Node para las pruebas.
 */

/** Franja de Inicio que queda visible en el borde derecho con el menu abierto. */
export const DRAWER_VISIBLE_STRIP = 75;
export const DRAWER_CORNER_RADIUS = 50;
export const DRAWER_VEIL_MAX = 0.05;
export const DRAWER_MENU_OFFSET_Y = 7;
export const DRAWER_SHADOW_MAX = 0.24;
export const DRAWER_ELEVATION_MAX = 18;
/** Fraccion del progreso en la que las esquinas ya alcanzan su radio final. */
export const DRAWER_CORNER_RAMP = 0.18;
/** Fraccion del progreso en la que el menu ya es totalmente visible. */
export const DRAWER_MENU_FADE_RAMP = 1;
export const DRAWER_MENU_SHIFT_RAMP = 1;
export const DRAWER_GESTURE_ACTIVE_X = 10;
export const DRAWER_GESTURE_FAIL_Y = 14;
export const DRAWER_FULL_DURATION = 360;

function clamp01(value: number) {
  "worklet";
  if (!(value > 0)) return 0;
  return value > 1 ? 1 : value;
}

function easeOut(t: number) {
  "worklet";
  const inv = 1 - t;
  return 1 - inv * inv * inv;
}

/** Distancia horizontal de la pantalla frontal: ancho actual menos la franja visible. */
export function drawerOffset(windowWidth: number) {
  "worklet";
  return Math.max(0, windowWidth - DRAWER_VISIBLE_STRIP);
}

export function foregroundTranslateX(progress: number, windowWidth: number) {
  "worklet";
  return drawerOffset(windowWidth) * clamp01(progress);
}

export function foregroundCornerRadius(progress: number) {
  "worklet";
  return DRAWER_CORNER_RADIUS * easeOut(clamp01(progress / DRAWER_CORNER_RAMP));
}

export function foregroundVeilOpacity(progress: number) {
  "worklet";
  return DRAWER_VEIL_MAX * clamp01(progress);
}

export function foregroundShadowOpacity(progress: number) {
  "worklet";
  return DRAWER_SHADOW_MAX * clamp01(progress);
}

export function foregroundElevation(progress: number) {
  "worklet";
  return DRAWER_ELEVATION_MAX * clamp01(progress);
}

export function menuContentOpacity(progress: number) {
  "worklet";
  return clamp01(progress / DRAWER_MENU_FADE_RAMP);
}

/** -7 px al inicio de la apertura, 0 en su posicion final (se mueve 7 px hacia abajo). */
export function menuContentTranslateY(progress: number) {
  "worklet";
  const remaining = 1 - clamp01(progress / DRAWER_MENU_SHIFT_RAMP);
  return remaining === 0 ? 0 : -DRAWER_MENU_OFFSET_Y * remaining;
}

/** Progreso durante un arrastre, a partir del progreso inicial y la traslacion. */
export function dragProgress(startProgress: number, translationX: number, windowWidth: number) {
  "worklet";
  const offset = drawerOffset(windowWidth);
  if (offset <= 0) return startProgress;
  return clamp01(startProgress + translationX / offset);
}

/** Decide si al soltar el gesto el drawer queda abierto. */
export function shouldSettleOpen(progress: number, velocityX: number) {
  "worklet";
  if (velocityX > 500) return true;
  if (velocityX < -500) return false;
  return progress >= 0.5;
}

export function settleDuration(fromProgress: number, target: number) {
  "worklet";
  const distance = Math.abs(target - clamp01(fromProgress));
  return Math.round(DRAWER_FULL_DURATION * Math.max(0.35, distance));
}

/** "/(tabs)/profile" -> "/profile"; quita grupos y barra final. */
export function normalizeRoutePath(path: string) {
  const clean = path.split("?")[0].replace(/\/\([^/]+\)/g, "");
  const trimmed = clean.length > 1 ? clean.replace(/\/+$/, "") : clean;
  return trimmed || "/";
}

export type DrawerReadySource = "layout" | "route";

/**
 * Controlador puro de tokens: invalida callbacks de animaciones antiguas y
 * guarda la seleccion pendiente hasta que el destino confirma que esta listo.
 */
export function createDrawerTransitionController() {
  let animationToken = 0;
  let selectionToken = 0;
  let pending: { token: number; source: DrawerReadySource; target?: string } | null = null;
  return {
    beginAnimation() {
      animationToken += 1;
      return animationToken;
    },
    isCurrentAnimation(token: number) {
      return token === animationToken;
    },
    beginSelection(source: DrawerReadySource, target?: string) {
      selectionToken += 1;
      pending = { token: selectionToken, source, target };
      return selectionToken;
    },
    cancelSelection() {
      pending = null;
      selectionToken += 1;
      return selectionToken;
    },
    pendingSelection() {
      return pending;
    },
    /** Devuelve el token confirmado o null si la confirmacion no corresponde. */
    acknowledge(source: DrawerReadySource, target?: string) {
      if (!pending || pending.source !== source) return null;
      if (pending.target && pending.target !== target) return null;
      const token = pending.token;
      pending = null;
      return token;
    },
    isPendingSelection(token: number) {
      return pending !== null && pending.token === token;
    },
    isCurrentSelection(token: number) {
      return token === selectionToken && pending === null;
    },
  };
}

export type DrawerTransitionController = ReturnType<typeof createDrawerTransitionController>;
