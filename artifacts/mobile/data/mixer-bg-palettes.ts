/**
 * Paletas predefinidas (on-brand, en tonos claros) para el FONDO del área de
 * cards del Mezclador. NO afectan el header. Se eligen desde los Ajustes del
 * Mezclador. Cada paleta es un degradado vertical de 3 paradas; el primer color
 * se usa también como muestra (swatch) en el selector.
 */

export type MixerBgPaletteId =
  | "arena"
  | "noche";

export interface MixerBgPalette {
  id: MixerBgPaletteId;
  label: string;
  /** Degradado vertical (3 paradas) del fondo del área de cards */
  colors: [string, string, string];
}

export const MIXER_BG_PALETTES: MixerBgPalette[] = [
  { id: "arena", label: "Arena dorada",  colors: ["#FEFCF5", "#FAF3E4", "#F5ECDA"] },
  { id: "noche", label: "Noche borgoña", colors: ["#5C2929", "#2E0510", "#1B060F"] },
];

export const DEFAULT_MIXER_BG_PALETTE: MixerBgPaletteId = "noche";

export function getMixerBgPalette(id: string | null | undefined): MixerBgPalette {
  return (
    MIXER_BG_PALETTES.find((p) => p.id === id) ??
    MIXER_BG_PALETTES.find((p) => p.id === DEFAULT_MIXER_BG_PALETTE)!
  );
}
