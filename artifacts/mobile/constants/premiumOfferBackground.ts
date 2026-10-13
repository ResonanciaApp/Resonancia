import { SCENE_THEMES } from "@/config/scene-themes";

const indigo = SCENE_THEMES.indigo2.gradient;
export const PREMIUM_OFFER_LOGO_GRADIENT = indigo.slice(1, 4) as [string, string, ...string[]];
// Purchase button keeps its existing color; selected cards have their own tint.
export const PREMIUM_OFFER_ACCENT = "#2D2F7C";

function adjustColor(hex: string, brightness: number, contrast = 1, saturation = 1): string {
  const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const max = Math.max(...rgb);
  const min = Math.min(...rgb);
  const lightness = (max + min) / 2;
  const originalSaturation = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lightness - 1));
  const saturationScale = originalSaturation === 0 ? 1 : Math.min(1, originalSaturation * saturation) / originalSaturation;
  return "#" + rgb.map(channel => {
    const saturated = lightness + (channel - lightness) * saturationScale;
    const adjusted = (saturated * brightness - 0.5) * contrast + 0.5;
    return Math.round(Math.max(0, Math.min(1, adjusted)) * 255).toString(16).padStart(2, "0");
  }).join("").toUpperCase();
}

// Keep saturation +5%; reduce the previous brightness by 15% and contrast by 5%.
export const PREMIUM_OFFER_BACKGROUND = indigo.map(color => adjustColor(color, 0.7 * 0.85, 1.1 * 0.95, 1.05)) as [string, string, ...string[]];
export const PREMIUM_OFFER_SELECTED_CARD = adjustColor(indigo[indigo.length - 1], 1.05);
export const PREMIUM_OFFER_LOCATIONS = SCENE_THEMES.indigo2.gradientLocations;