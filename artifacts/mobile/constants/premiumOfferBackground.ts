import { SCENE_THEMES } from "@/config/scene-themes";

const indigo = SCENE_THEMES.indigo2.gradient;
export const PREMIUM_OFFER_LOGO_GRADIENT = indigo.slice(1, 4) as [string, string, ...string[]];

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

// Keep the existing adjustments, then darken the resulting background another 25%.
export const PREMIUM_OFFER_BACKGROUND = indigo.map(color =>
  adjustColor(adjustColor(color, 0.7 * 0.85, 1.1 * 0.95, 1.05), 0.75),
) as [string, string, ...string[]];
export const PREMIUM_OFFER_SELECTED_CARD = adjustColor(indigo[indigo.length - 1], 1.05);
export const PREMIUM_OFFER_ACCENT = PREMIUM_OFFER_SELECTED_CARD;
export const PREMIUM_OFFER_LOCATIONS = SCENE_THEMES.indigo2.gradientLocations;