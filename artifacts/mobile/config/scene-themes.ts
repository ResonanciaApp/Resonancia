/** Temas visuales de la app; las escenas de audio son independientes. */
import type { SceneId } from "@/context/AmbientPlayerContext";

export type VisualThemeId = "tibet" | "indigo2" | "cloudy" | "cloudy2";
export type ThemeSceneId = SceneId | VisualThemeId;
export const VISUAL_THEME_IDS = ["tibet", "indigo2", "cloudy", "cloudy2"] as const;
export const SCENE_THEME_STORAGE_KEY = "@active_theme_scene";

export type SceneTheme = {
  id: ThemeSceneId;
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

const INDIGO2_THEME: SceneTheme = {
  id: "indigo2",
  label: "Indigo 2",
  // Base palette adjusted once: HSL saturation ×1.04, RGB contrast ×1.02 around 50%.
  gradient: ["#21315F", "#21295D", "#22265D", "#27215F", "#27225C", "#31215F", "#342265"],
  gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
  gradientStart: { x: 0.5, y: 0 },
  gradientEnd: { x: 0.5, y: 1 },
  solid: "#21315F",
  accent: "#E8E8E8",
};

export const SCENE_THEMES: Record<VisualThemeId, SceneTheme> = {
  tibet: {
    id: "tibet",
    label: "Universo",
    gradient: ["#371C5F", "#332261", "#2E2468", "#252A6A", "#222B6C", "#1C2E6E", "#112F70"],
    gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
    gradientStart: { x: 0.5, y: 0 },
    gradientEnd: { x: 0.5, y: 1 },
    solid: "#0B1438",
  },
  indigo2: INDIGO2_THEME,
  cloudy: {
    ...INDIGO2_THEME,
    id: "cloudy",
    label: "Cloudy",
    gradient: ["#2D2F7C", "#2D3981", "#2D4085", "#2A4687", "#25528C", "#1F5D92", "#166494"],
    gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
    solid: "#2D2F7C",
  },
  cloudy2: {
    ...INDIGO2_THEME,
    id: "cloudy2",
    label: "Cloudy 2",
    gradient: ["#165794", "#1E5492", "#254B8D", "#2A4687", "#2D4085", "#2D3981", "#2D2F7C"],
    gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
    solid: "#165794",
  },
};

export const DEFAULT_THEME_ID = "tibet" satisfies VisualThemeId;

/** Resonancia hereda exactamente las reglas visuales especiales de Índigo. */
export function isIndigoThemeId(id: ThemeSceneId): boolean {
  return id === "indigo" || id === "resonancia";
}

/** Los temas Cloudy conservan las reglas de Índigo 2, no su paleta. */
export function isIndigo2ThemeId(id: ThemeSceneId): boolean {
  return id === "indigo2" || id === "cloudy" || id === "cloudy2";
}

export function isVisualThemeId(id: unknown): id is VisualThemeId {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(SCENE_THEMES, id);
}
