/** Temas visuales de la app; las escenas de audio son independientes. */
import type { SceneId } from "@/context/AmbientPlayerContext";

export type VisualThemeId = "tibet" | "indigo2";
export const SCENE_THEME_STORAGE_KEY = "@active_theme_scene";

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

export const SCENE_THEMES: Record<VisualThemeId, SceneTheme> = {
  tibet: {
    id: "tibet",
    label: "Universo",
    gradient: ["#262355", "#2A2460", "#282565", "#232C60", "#262F6B", "#283175"],
    solid: "#0B1438",
  },
  indigo2: {
    id: "indigo2",
    label: "Indigo 2",
    gradient: ["#1C2B59", "#1C2458", "#1D2158", "#221D57", "#221C59", "#2B1C59", "#2E1D60"],
    gradientLocations: [0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1],
    gradientStart: { x: 0.5, y: 0 },
    gradientEnd: { x: 0.5, y: 1 },
    solid: "#1C2B59",
    accent: "#E8E8E8",
  },
};

export const DEFAULT_THEME_ID = "tibet" satisfies VisualThemeId;

/** Resonancia hereda exactamente las reglas visuales especiales de Índigo. */
export function isIndigoThemeId(id: SceneId): boolean {
  return id === "indigo" || id === "resonancia";
}
