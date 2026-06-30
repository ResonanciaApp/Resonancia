import { Easing } from "react-native";

/** Curvas easing del lenguaje de movimiento (Apple / Calm / Insight Timer) */
export const easeOutCubic = Easing.out(Easing.cubic);
export const easeOutQuart = Easing.out(Easing.poly(4));
export const easeInCubic  = Easing.in(Easing.cubic);

/**
 * Duraciones estándar en ms.
 * Filosofía: lento, contemplativo — sin rebotes ni overshoot.
 */
export const DURATION = {
  /** Transición entre pestañas del tab bar (ícono + label cross-fade) */
  TAB: 250,
  /** Apertura de modales (full-screen overlay) */
  MODAL_OPEN: 350,
  /** Cierre de modales */
  MODAL_CLOSE: 280,
  /** Apertura de sheets y bottom sheets */
  SHEET_OPEN: 350,
  /** Cierre de sheets y bottom sheets */
  SHEET_CLOSE: 280,
  /** Aparición de cards: opacity + scale + translateY */
  CARD: 280,
  /** Presión de botón: scale 100% → 97% (feedback táctil hacia adentro) */
  BUTTON_PRESS: 120,
  /** Liberación de botón: scale 97% → 100%, sin rebote */
  BUTTON_RELEASE: 180,
  /** Transiciones del player: play/pausa, crossfade */
  PLAYER: 250,
  /** Micro-interacciones: highlights, flashes breves */
  MICRO: 180,
  /** Crossfades y fades estándar */
  FADE: 300,
  /** Menú lateral / drawer */
  DRAWER: 350,
} as const;

/**
 * Genera una config lista para usar en `Animated.timing` o `withTiming`.
 * No incluye `useNativeDriver` — añadirlo en el call site según necesidad.
 *
 * @example
 *   Animated.timing(val, { ...motionTiming(DURATION.SHEET_OPEN), useNativeDriver: true })
 *   sharedValue.value = withTiming(1, motionTiming(DURATION.SHEET_OPEN))
 */
export function motionTiming(
  duration: number,
  easing: (t: number) => number = easeOutCubic,
): { duration: number; easing: (t: number) => number } {
  return { duration, easing };
}
