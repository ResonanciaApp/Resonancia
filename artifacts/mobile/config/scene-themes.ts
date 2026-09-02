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
    gradient: ["#1C1B28", "#1C1B28"],
    solid: "#1C1B28",
  },
  indigo2: {
    id: "indigo2",
    label: "Indigo 2",
    gradient: ["#191B21", "#16161D", "#101014"],
    solid: "#101014",
    accent: "#868887",
  },
};

export const DEFAULT_THEME_ID: SceneId = "tibet";

export const SCENE_THEME_STORAGE_KEY = "@active_theme_scene";
