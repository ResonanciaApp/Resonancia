/**
 * Paletas predefinidas (on-brand, en tonos claros) para el FONDO del área de
 * cards del Mezclador. NO afectan el header. Se eligen desde los Ajustes del
 * Mezclador. Cada paleta es un degradado vertical de 3 paradas; el primer color
 * se usa también como muestra (swatch) en el selector.
 */

export type MixerBgPaletteId =
  | "lavanda"
  | "arena"
  | "rosa"
  | "menta"
  | "cielo";

export interface MixerBgPalette {
  id: MixerBgPaletteId;
  label: string;
  /** Degradado vertical (3 paradas) del fondo del área de cards */
  colors: [string, string, string];
}

export const MIXER_BG_PALETTES: MixerBgPalette[] = [
  { id: "arena",   label: "Arena dorada", colors: ["#FBF6E9", "#F3E7CC", "#EFDFC0"] },
  { id: "lavanda", label: "Lavanda", colors: ["#F7F6E5", "#EBE3F5", "#EBE3F5"] },
  { id: "rosa",    label: "Rosa borgoña", colors: ["#FBEFEF", "#F3DEE0", "#EAD2D6"] },
  { id: "menta",   label: "Bruma menta", colors: ["#EEF6EE", "#DFEFE3", "#D6E9DC"] },
  { id: "cielo",   label: "Cielo sereno", colors: ["#EEF3FA", "#DEE8F4", "#D4E0F0"] },
];

export const DEFAULT_MIXER_BG_PALETTE: MixerBgPaletteId = "arena";

export function getMixerBgPalette(id: string | null | undefined): MixerBgPalette {
  return (
    MIXER_BG_PALETTES.find((p) => p.id === id) ??
    MIXER_BG_PALETTES.find((p) => p.id === DEFAULT_MIXER_BG_PALETTE)!
  );
}
