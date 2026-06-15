import { ImageSourcePropType } from "react-native";

export type GradientPreset = {
  id: string;
  name: string;
  colors: readonly [string, string, string];
  emoji: string;
  /** Si está presente, usa esta imagen de fondo en lugar del degradado */
  image?: ImageSourcePropType;
  /** Color de overlay oscuro encima de la imagen para legibilidad (rgba) */
  imageOverlay?: string;
  /** Si true, el contenido del MixerSheet usa paleta clara (texto oscuro) */
  isLight?: boolean;
};

export const GRADIENT_PRESETS: GradientPreset[] = [
  // ── Tema claro (default) ───────────────────────────────────────────────────
  {
    id: "blanco",
    name: "Claro",
    colors: ["#F5F0F0", "#EDE8EE", "#FAF6FA"],
    emoji: "☁️",
    isLight: true,
  },
  // ── Imágenes de naturaleza ─────────────────────────────────────────────────
  {
    id: "bosque",
    name: "Bosque",
    colors: ["#022B18", "#053D24", "#010F09"],
    emoji: "🌲",
    image: require("../assets/images/immersive/bosque.png"),
    imageOverlay: "rgba(2,20,10,0.38)",
  },
  {
    id: "montanas",
    name: "Montañas",
    colors: ["#0A0818", "#161030", "#05040E"],
    emoji: "🏔️",
    image: require("../assets/images/immersive/montanas.png"),
    imageOverlay: "rgba(8,5,20,0.35)",
  },
  {
    id: "oceano-img",
    name: "Océano",
    colors: ["#010F1F", "#022444", "#010810"],
    emoji: "🌊",
    image: require("../assets/images/immersive/oceano.png"),
    imageOverlay: "rgba(1,10,28,0.38)",
  },
  {
    id: "desierto-img",
    name: "Desierto",
    colors: ["#1A1008", "#2B1A0A", "#0D0804"],
    emoji: "🏜️",
    image: require("../assets/images/immersive/desierto.png"),
    imageOverlay: "rgba(18,10,4,0.35)",
  },
  {
    id: "estrellas",
    name: "Estrellas",
    colors: ["#060B1A", "#0D1533", "#030509"],
    emoji: "✨",
    image: require("../assets/images/immersive/estrellas.png"),
    imageOverlay: "rgba(4,6,18,0.32)",
  },
  // ── Degradados puros ───────────────────────────────────────────────────────
  { id: "borgona",  name: "Borgoña",           colors: ["#27070E", "#1B060F", "#0F0308"], emoji: "🍷" },
  { id: "cosmos",   name: "Cosmos",             colors: ["#060B1A", "#0D1533", "#030509"], emoji: "🌌" },
  { id: "aurora",   name: "Aurora Boreal",      colors: ["#022B18", "#053D24", "#010F09"], emoji: "🌿" },
  { id: "oceano",   name: "Océano Profundo",    colors: ["#010F1F", "#022444", "#010810"], emoji: "🌊" },
  { id: "amanecer", name: "Amanecer",           colors: ["#2B1800", "#4A2B00", "#150C00"], emoji: "🌅" },
  { id: "volcan",   name: "Volcán",             colors: ["#2B0700", "#4A0F00", "#150400"], emoji: "🌋" },
  { id: "selva",    name: "Selva Nocturna",     colors: ["#051205", "#0A1E0A", "#030903"], emoji: "🌲" },
  { id: "luna",     name: "Luna Llena",         colors: ["#0A0A1A", "#151530", "#060608"], emoji: "🌙" },
  { id: "dorado",   name: "Meditación Dorada",  colors: ["#1A1200", "#2B1E00", "#0D0900"], emoji: "✨" },
  { id: "bruma",    name: "Bruma Matinal",      colors: ["#14101E", "#221A35", "#0A0810"], emoji: "🌫️" },
  { id: "nebulosa", name: "Nebulosa",           colors: ["#0A0825", "#140F3D", "#050412"], emoji: "💫" },
  { id: "desierto", name: "Desierto Oscuro",    colors: ["#1A1008", "#2B1A0A", "#0D0804"], emoji: "🏜️" },
  { id: "indigo",   name: "Índigo Profundo",    colors: ["#06061A", "#0A0A2B", "#030310"], emoji: "🔵" },
  { id: "fuego",    name: "Fuego Sagrado",      colors: ["#200800", "#380E00", "#100400"], emoji: "🔥" },
];

export const DEFAULT_BG_PRESET_ID = "blanco";
export const MIXER_BG_KEY = "@resonance_mixer_bg";
export const MIXER_OVERLAY_KEY = "@resonance_mixer_overlay";
export const DEFAULT_OVERLAY = 0.65;

let _bgListeners: Array<(id: string) => void> = [];
export function subscribeBgPreset(fn: (id: string) => void) {
  _bgListeners.push(fn);
  return () => { _bgListeners = _bgListeners.filter((l) => l !== fn); };
}
export function emitBgPresetChange(id: string) {
  _bgListeners.forEach((l) => l(id));
}

let _overlayListeners: Array<(v: number) => void> = [];
export function subscribeOverlay(fn: (v: number) => void) {
  _overlayListeners.push(fn);
  return () => { _overlayListeners = _overlayListeners.filter((l) => l !== fn); };
}
export function emitOverlayChange(v: number) {
  _overlayListeners.forEach((l) => l(v));
}
