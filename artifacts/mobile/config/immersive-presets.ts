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
  // ── Universo (default) ────────────────────────────────────────────────────
  {
    id: "blanco",
    name: "Universo",
    colors: ["#060B1A", "#0D1533", "#030509"],
    emoji: "🌌",
    image: require("../assets/images/cosmic-bg.png"),
    imageOverlay: "rgba(4,6,18,0.45)",
  },
  // ── Imágenes de naturaleza ─────────────────────────────────────────────────
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
  {
    id: "patagonia",
    name: "Patagonia",
    colors: ["#0A1218", "#12202A", "#050A0E"],
    emoji: "🏔️",
    image: require("../assets/images/immersive/patagonia.jpg"),
    imageOverlay: "rgba(5,12,18,0.42)",
  },
  {
    id: "santorini",
    name: "Santorini",
    colors: ["#0A0E1A", "#101830", "#050710"],
    emoji: "🌅",
    image: require("../assets/images/immersive/santorini.jpg"),
    imageOverlay: "rgba(6,8,20,0.38)",
  },
  {
    id: "kyoto",
    name: "Kyoto",
    colors: ["#050F08", "#0A1E10", "#030808"],
    emoji: "🎋",
    image: require("../assets/images/immersive/kyoto.jpg"),
    imageOverlay: "rgba(3,10,6,0.40)",
  },
  {
    id: "aurora",
    name: "Aurora Ártica",
    colors: ["#040E18", "#081A28", "#020810"],
    emoji: "🌌",
    image: require("../assets/images/immersive/aurora.jpg"),
    imageOverlay: "rgba(3,8,18,0.35)",
  },
  {
    id: "bali",
    name: "Bali",
    colors: ["#041008", "#081E10", "#020908"],
    emoji: "🌿",
    image: require("../assets/images/immersive/bali.jpg"),
    imageOverlay: "rgba(3,10,5,0.42)",
  },
  {
    id: "noruega",
    name: "Fiordos",
    colors: ["#061218", "#0A1E28", "#030A10"],
    emoji: "🏞️",
    image: require("../assets/images/immersive/noruega.jpg"),
    imageOverlay: "rgba(4,12,18,0.38)",
  },
  {
    id: "sahara",
    name: "Sahara",
    colors: ["#140A02", "#221204", "#0A0601"],
    emoji: "🌙",
    image: require("../assets/images/immersive/sahara.jpg"),
    imageOverlay: "rgba(14,8,2,0.38)",
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
export const MIXER_GEO_BG_KEY = "@resonance_mixer_geo_bg";

let _bgListeners: Array<(id: string) => void> = [];
export function subscribeBgPreset(fn: (id: string) => void) {
  _bgListeners.push(fn);
  return () => { _bgListeners = _bgListeners.filter((l) => l !== fn); };
}
export function emitBgPresetChange(id: string) {
  _bgListeners.forEach((l) => l(id));
}

let _geoListeners: Array<(id: string | null) => void> = [];
export function subscribeGeoBg(fn: (id: string | null) => void) {
  _geoListeners.push(fn);
  return () => { _geoListeners = _geoListeners.filter((l) => l !== fn); };
}
export function emitGeoBgChange(id: string | null) {
  _geoListeners.forEach((l) => l(id));
}

let _overlayListeners: Array<(v: number) => void> = [];
export function subscribeOverlay(fn: (v: number) => void) {
  _overlayListeners.push(fn);
  return () => { _overlayListeners = _overlayListeners.filter((l) => l !== fn); };
}
export function emitOverlayChange(v: number) {
  _overlayListeners.forEach((l) => l(v));
}
