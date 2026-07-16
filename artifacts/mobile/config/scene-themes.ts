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
  /** Color sólido de fondo — contenedores raíz, tab bar, sheets. */
  solid: string;
  /** Imagen de fondo opcional (require). Se muestra en variant="gradient" con overlay oscuro. */
  backgroundImage?: number;
};

export const SCENE_THEMES: Record<SceneId, SceneTheme> = {
  tibet: {
    id: "tibet",
    label: "Universo",
    gradient: ["#342261", "#2F2059", "#141D61", "#17275C"],
    solid: "#342261",
  },
  "vino-tinto": {
    id: "vino-tinto",
    label: "Tíbet",
    gradient: ["#2A0812", "#17040A"],
    solid: "#17040A",
    backgroundImage: require("@/assets/images/scenes/vino-tinto-buda.jpg"),
  },
  profundo: {
    id: "profundo",
    label: "Profundo",
    gradient: ["#2C1A32", "#1D152B", "#241C2F", "#111325"],
    solid: "#2C1A32",
  },
};

export const DEFAULT_THEME_ID: SceneId = "tibet";

export const SCENE_THEME_STORAGE_KEY = "@active_theme_scene";
