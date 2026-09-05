/**
 * Temas visuales globales por Escena (Task #82).
 * ─────────────────────────────────────────────────────────────────
 * Cada Escena del panel "Escenas" (Task #81) queda asociada a un tema
 * visual: un degradado de fondo + un color sólido de contenedor. El
 * tema activo se lee desde `context/SceneThemeContext.tsx` y se aplica
 * a los contenedores raíz (layout, tabs) y a `SacredBackground`.
 *
 * El tema por defecto ("naturaleza") conserva la estética actual
 * (borgoña + dorado). Los demás son variaciones oscuras coherentes con
 * la marca, pensadas para mantener legibilidad del dorado/texto claro.
 * ─────────────────────────────────────────────────────────────────
 */
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

export const SCENE_THEMES: Record<SceneId, SceneTheme> = {
  tibet: {
    id: "tibet",
    label: "Universo",
    gradient: ["#2D1C52", "#261F57", "#1F255A", "#1F2A62"],
    solid: "#1F2A62",
  },
  profundo: {
    id: "profundo",
    label: "Profundo",
    gradient: ["#311F3D", "#2C1C38", "#291A34", "#261830", "#23162D", "#21142A"],
    solid: "#311F3D",
  },
  indigo: {
    id: "indigo",
    label: "Índigo",
    gradient: ["#181824", "#181824"],
    solid: "#181824",
  },
  resonancia: {
    id: "resonancia",
    label: "Resonancia",
    gradient: ["#2E4369", "#263654", "#1D2A3D", "#17202E"],
    solid: "#17202E",
    accent: "#E2E2E2",
  },
  indigo2: {
    id: "indigo2",
    label: "Indigo 2",
    gradient: ["#111827", "#16213A", "#18264A"],
    gradientLocations: [0, 0.45, 1],
    gradientStart: { x: 0, y: 0 },
    gradientEnd: { x: 1, y: 1 },
    solid: "#000000",
    accent: "#868887",
    radialGlows: [
      {
        cx: 80,
        cy: 10,
        r: 58,
        stops: [
          { offset: 0, color: "#5F69FF", opacity: 0.32 },
          { offset: 0.28, color: "#4650B4", opacity: 0.16 },
          { offset: 0.58, color: "#4650B4", opacity: 0 },
        ],
      },
      {
        cx: 25,
        cy: 100,
        r: 60,
        stops: [
          { offset: 0, color: "#6946FF", opacity: 0.2 },
          { offset: 0.3, color: "#463CAA", opacity: 0.1 },
          { offset: 0.6, color: "#463CAA", opacity: 0 },
        ],
      },
    ],
  },
};

export const DEFAULT_THEME_ID: SceneId = "tibet";

export const SCENE_THEME_STORAGE_KEY = "@active_theme_scene";

/** Resonancia hereda exactamente las reglas visuales especiales de Índigo. */
export function isIndigoThemeId(id: SceneId): boolean {
  return id === "indigo" || id === "resonancia";
}
