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
  /** Degradado de fondo (2 stops) usado en pantallas con LinearGradient de raíz. */
  gradient: readonly [string, string];
  /** Color sólido de fondo — contenedores raíz, tab bar, sheets. */
  solid: string;
};

export const SCENE_THEMES: Record<SceneId, SceneTheme> = {
  profundo: {
    id: "profundo",
    label: "Profundo",
    gradient: ["#170e21", "#140c1c"],
    solid: "#140c1c",
  },
  tibet: {
    id: "tibet",
    label: "Tibet",
    gradient: ["#170e21", "#140c1c"],
    solid: "#140c1c",
  },
  orquidea: {
    id: "orquidea",
    label: "Orquídea",
    gradient: ["#2E1529", "#1E0D1C"],
    solid: "#1E0D1C",
  },
  "vino-tinto": {
    id: "vino-tinto",
    label: "Vino tinto",
    gradient: ["#2E0D16", "#1A0810"],
    solid: "#1A0810",
  },
  naturaleza: {
    id: "naturaleza",
    label: "Naturaleza",
    gradient: ["#312267", "#231847"],
    solid: "#140B2C",
  },
  bosque: {
    id: "bosque",
    label: "Bosque",
    gradient: ["#14301F", "#0F241D"],
    solid: "#0B1710",
  },
  lluvia: {
    id: "lluvia",
    label: "Lluvia",
    gradient: ["#284254", "#1D2F3D"],
    solid: "#101B22",
  },
  viento: {
    id: "viento",
    label: "Viento",
    gradient: ["#1B466C", "#13304A"],
    solid: "#091827",
  },
  musgo: {
    id: "musgo",
    label: "Musgo",
    gradient: ["#396B3A", "#064439"],
    solid: "#101A16",
  },
  nebulosa: {
    id: "nebulosa",
    label: "Nebulosa",
    gradient: ["#351E62", "#113071"],
    solid: "#113071",
  },
  zafiro: {
    id: "zafiro",
    label: "Zafiro",
    gradient: ["#156393", "#2C347F"],
    solid: "#2E2F7F",
  },
  solaris: {
    id: "solaris",
    label: "Solaris",
    gradient: ["#4C2245", "#2A1A2F"],
    solid: "#2A1A2F",
  },
};

export const DEFAULT_THEME_ID: SceneId = "profundo";

export const SCENE_THEME_STORAGE_KEY = "@active_theme_scene";
