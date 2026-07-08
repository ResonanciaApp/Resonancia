/**
 * Temas visuales globales por Escena (Task #82).
 * ─────────────────────────────────────────────────────────────────
 * Cada Escena del panel "Escenas" (Task #81) queda asociada a un tema
 * visual: un degradado de fondo + un color sólido de contenedor. El
 * tema activo se lee desde `context/SceneThemeContext.tsx` y se aplica
 * a los contenedores raíz (layout, tabs) y a `SacredBackground`.
 *
 * El tema por defecto ("universo") conserva la estética actual
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
  universo: {
    id: "universo",
    label: "Universo",
    gradient: ["#821E1E", "#4D171A"],
    solid: "#751238",
  },
  naturaleza: {
    id: "naturaleza",
    label: "Naturaleza",
    gradient: ["#312267", "#140B2C"],
    solid: "#140B2C",
  },
  bosque: {
    id: "bosque",
    label: "Bosque",
    gradient: ["#14301F", "#081712"],
    solid: "#0B1710",
  },
  lluvia: {
    id: "lluvia",
    label: "Lluvia",
    gradient: ["#1D2E3A", "#0D161D"],
    solid: "#101B22",
  },
  viento: {
    id: "viento",
    label: "Viento",
    gradient: ["#1B466C", "#091827"],
    solid: "#091827",
  },
  fuegoSolar: {
    id: "fuegoSolar",
    label: "Fuego solar",
    gradient: ["#603127", "#26120F"],
    solid: "#26120F",
  },
  musgo: {
    id: "musgo",
    label: "Musgo",
    gradient: ["#28483E", "#101A16"],
    solid: "#101A16",
  },
  orquidea: {
    id: "orquidea",
    label: "Orquídea",
    gradient: ["#833E6A", "#4F366F"],
    solid: "#4F366F",
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
    gradient: ["#156394", "#2E2F7F"],
    solid: "#2E2F7F",
  },
  vinoTinto: {
    id: "vinoTinto",
    label: "Vino Tinto",
    gradient: ["#2F0511", "#19020A"],
    solid: "#19020A",
  },
};

export const DEFAULT_THEME_ID: SceneId = "universo";

export const SCENE_THEME_STORAGE_KEY = "@active_theme_scene";
