export type GradientPreset = {
  id: string;
  name: string;
  colors: readonly [string, string, string];
  emoji: string;
};

export const GRADIENT_PRESETS: GradientPreset[] = [
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
  { id: "desierto", name: "Desierto",           colors: ["#1A1008", "#2B1A0A", "#0D0804"], emoji: "🏜️" },
  { id: "indigo",   name: "Índigo Profundo",    colors: ["#06061A", "#0A0A2B", "#030310"], emoji: "🔵" },
  { id: "fuego",    name: "Fuego Sagrado",      colors: ["#200800", "#380E00", "#100400"], emoji: "🔥" },
];

export const DEFAULT_BG_PRESET_ID = "borgona";
export const MIXER_BG_KEY = "@resonance_mixer_bg";
