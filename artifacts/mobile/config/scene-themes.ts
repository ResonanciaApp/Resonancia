/** Temas visuales de la app; las escenas de audio son independientes. */
import type { SceneId } from "@/context/AmbientPlayerContext";

export type VisualThemeId = "tibet" | "indigo2" | "cloudy" | "cloudy2" | "natural" | "pleyades" | "galactic" | "fuego";
export type ThemeSceneId = SceneId | VisualThemeId;
export const VISUAL_THEME_IDS = ["tibet", "indigo2", "cloudy", "cloudy2", "natural", "pleyades", "galactic", "fuego"] as const;
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
  gradient: ["#222C5D", "#22295D", "#23275D", "#24235C", "#2C225F", "#32225F", "#352366"],
  gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
  gradientStart: { x: 0.5, y: 0 },
  gradientEnd: { x: 0.5, y: 1 },
  solid: "#222C5D",
  accent: "#E8E8E8",
};

export const NATURAL_GRADIENT = ["#4A7D48", "#3B6D3C", "#326740", "#285E3E", "#175543", "#0B4B3D", "#073B32"] as const;
export const NATURAL_GRADIENT_LOCATIONS = [0, 0.16, 0.33, 0.5, 0.68, 0.84, 1] as const;
// Premium and Galactic retain their original palette order independently of Cloudy.
const PREMIUM_BASE_GRADIENT = ["#2D2F7C", "#2D3981", "#2D4085", "#2A4687", "#25528C", "#1F5D92", "#166494"] as const;
const CLOUDY_THEME: SceneTheme = {
  ...INDIGO2_THEME,
  id: "cloudy",
  label: "Cloudy",
  gradient: ["#166494", "#1F5D92", "#25528C", "#2A4687", "#2D4085", "#2D3981", "#2D2F7C"],
  gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
  solid: "#166494",
};

export const PREMIUM_BACKGROUND_GRADIENT = PREMIUM_BASE_GRADIENT.map(
  color => "#" + [1, 3, 5].map(offset =>
    Math.round(parseInt(color.slice(offset, offset + 2), 16) * 0.55)
      .toString(16).padStart(2, "0"),
  ).join(""),
) as [string, string, ...string[]];
const GALACTIC_GRADIENT = [...PREMIUM_BACKGROUND_GRADIENT].reverse().map(
  color => "#" + [1, 3, 5].map(offset =>
    Math.min(255, Math.round(parseInt(color.slice(offset, offset + 2), 16) * 1.05))
      .toString(16).padStart(2, "0"),
  ).join(""),
) as [string, string, ...string[]];

export const SCENE_THEMES: Record<VisualThemeId, SceneTheme> = {
  fuego: {
    ...CLOUDY_THEME,
    id: "fuego",
    label: "Fuego",
    // Updated with HSL saturation ×1.05, then RGB brightness ×1.07.
    gradient: ["#8D4A2E", "#8D4A2E", "#8C482D", "#8D452E", "#8D412F", "#8D3C2F"],
    gradientLocations: [0, 0.2, 0.4, 0.6, 0.8, 1],
    solid: "#8D4A2E",
  },
  galactic: {
    ...INDIGO2_THEME,
    id: "galactic",
    label: "Galactic",
    gradient: GALACTIC_GRADIENT,
    solid: GALACTIC_GRADIENT[0],
  },
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
  cloudy: CLOUDY_THEME,
  cloudy2: {
    ...INDIGO2_THEME,
    id: "cloudy2",
    label: "Cloudy 2",
    gradient: ["#165794", "#1E5492", "#254B8D", "#2A4687", "#2D4085", "#2D3981", "#2D2F7C"],
    gradientLocations: [0, 0.167, 0.333, 0.5, 0.667, 0.833, 1],
    solid: "#165794",
  },
  natural: {
    ...CLOUDY_THEME,
    id: "natural",
    label: "Natural",
    gradient: NATURAL_GRADIENT,
    gradientLocations: NATURAL_GRADIENT_LOCATIONS,
    solid: NATURAL_GRADIENT[0],
  },
  pleyades: {
    ...INDIGO2_THEME,
    id: "pleyades",
    label: "Pleyades",
    gradient: ["#371C5F", "#332261", "#2D2468", "#242A6B", "#212B6D", "#1E2D6E", "#192E70"],
    solid: "#371C5F",
  },
};

export const DEFAULT_THEME_ID = "tibet" satisfies VisualThemeId;

/** Resonancia hereda exactamente las reglas visuales especiales de Índigo. */
export function isIndigoThemeId(id: ThemeSceneId): boolean {
  return id === "indigo" || id === "resonancia";
}

/** Los temas Cloudy conservan las reglas de Índigo 2, no su paleta. */
export function isIndigo2ThemeId(id: ThemeSceneId): boolean {
  const styleId = getThemeStyleId(id);
  return styleId === "indigo2" || styleId === "cloudy" || styleId === "cloudy2";
}

/** Style inheritance only: selection, persistence and transitions retain the real ID. */
export function getThemeStyleId(id: string | null | undefined): string | null | undefined {
  if (id === "natural" || id === "fuego") return "cloudy";
  if (id === "pleyades" || id === "galactic") return "indigo2";
  return id;
}

/** Opt-in palette for sleep reminder and Ambiental start CTAs only. */
export function getSleepActionColors(id: string): { background: string; foreground: string } | null {
  if (id === "natural") return { background: "#F9F9F9", foreground: "#073B32" };
  if (id === "pleyades" || id === "galactic" || id === "fuego") return { background: "#F9F9F9", foreground: "#0B1438" };
  return null;
}

export function isVisualThemeId(id: unknown): id is VisualThemeId {
  return typeof id === "string" && Object.prototype.hasOwnProperty.call(SCENE_THEMES, id);
}
