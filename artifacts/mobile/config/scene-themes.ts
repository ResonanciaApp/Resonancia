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
    gradient: ["#2D1C52", "#261F57", "#1F255A", "#1F2A62", "#283673", "#2D4082"],
    solid: "#2D1C52",
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
    gradient: ["#30213A","#2C1E36","#291C32","#261A2E","#23182B","#211628"],
    solid: "#30213A",
  },
  indigo: {
    id: "indigo",
    label: "Índigo",
    gradient: ["#181231","#17183E","#191F3F"],
    solid: "#181231",
  },
};

export const DEFAULT_THEME_ID: SceneId = "tibet";

export const SCENE_THEME_STORAGE_KEY = "@active_theme_scene";
