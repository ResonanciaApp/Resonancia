import { Easing } from "react-native";

/** Curvas easing del lenguaje de movimiento (inspirado en Apple / Calm) */
export const easeOutCubic = Easing.out(Easing.cubic);
export const easeOutQuart = Easing.out(Easing.ease);
export const easeInCubic  = Easing.in(Easing.cubic);

/**
 * Duraciones estándar en ms.
 * Filosofía: lento, contemplativo, nunca rápido ni elástico.
 */
export const DURATION = {
  /** Fade entre pestañas del tab bar (ícono + label) */
  TAB: 250,
  /** Apertura de sheets y modales de bottom */
  SHEET_OPEN: 350,
  /** Cierre de sheets y modales de bottom */
  SHEET_CLOSE: 280,
  /** Aparición de cards: opacity + scale + translateY */
  CARD: 280,
  /** Presión de botón: scale 100% → 97% */
  BUTTON_PRESS: 120,
  /** Liberación de botón: scale 97% → 100%, sin rebote */
  BUTTON_RELEASE: 180,
  /** Transiciones del player: play/pausa, crossfade de imagen */
  PLAYER: 250,
  /** Micro-interacciones: highlights, flashes breves */
  MICRO: 180,
  /** Crossfades y fades estándar */
  FADE: 300,
  /** Menú lateral / drawer */
  DRAWER: 350,
} as const;
