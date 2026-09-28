/** Tema visual único de la app; las escenas de audio son independientes. */
import type { SceneId } from "@/context/AmbientPlayerContext";

export type SceneTheme = {
  id: SceneId;
  label: string;
  /** Degradado de fondo (mínimo 2 stops) usado en pantallas con LinearGradient de raíz. */
  gradient: readonly [string, string, ...string[]];
  /** Posiciones opcionales de los stops del degradado, expresadas entre 0 y 1. */
  gradientLocations?: readonly [number, number, ...number[]];
  /** Dirección opcional del degradado lineal base. */
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
  /** Color sólido de fondo — contenedores raíz, tab bar, sheets. */
  solid: string;
  /** Imagen de fondo opcional (require). Se muestra en variant="gradient" con overlay oscuro. */
  backgroundImage?: number;
  /** Color de acento del tema (links, tags, detalles). */
  accent?: string;
  /** Brillo radial opcional (centro) — se dibuja sobre el degradado en variant="gradient". */
  radialCenter?: string;
  /** Brillo radial opcional (borde). */
  radialOuter?: string;
  /**
   * Stops del degradado radial SVG (N stops con color+opacidad).
   * Cuando está presente reemplaza radialCenter/radialOuter.
   * offset: 0–1, color: hex, opacity: 0–1.
   */
  radialStops?: Array<{ offset: number; color: string; opacity: number }>;
  /** Luces radiales ambientales posicionables, compuestas sobre el degradado base. */
  radialGlows?: Array<{
    cx: number;
    cy: number;
    r: number;
    stops: Array<{ offset: number; color: string; opacity: number }>;
  }>;
};

export const SCENE_THEMES: Record<"indigo2", SceneTheme> = {
  indigo2: {
    id: "indigo2",
    label: "Indigo 2",
    // En HSL: los primeros tres tonos tienen +3 puntos de saturación;
    // los últimos tres, +2; todos tienen +0,5 puntos de luminosidad.
    gradient: ["#1D2557", "#1D1F57", "#201D57", "#231E56", "#2B1E56", "#2F1E56"],
    gradientLocations: [0, 0.2, 0.4, 0.6, 0.8, 1],
    gradientStart: { x: 0.5, y: 0 },
    gradientEnd: { x: 0.5, y: 1 },
    solid: "#1D2557",
    accent: "#E8E8E8",
  },
};

export const DEFAULT_THEME_ID: SceneId = "indigo2";

/** Resonancia hereda exactamente las reglas visuales especiales de Índigo. */
export function isIndigoThemeId(id: SceneId): boolean {
  return id === "indigo" || id === "resonancia";
}
