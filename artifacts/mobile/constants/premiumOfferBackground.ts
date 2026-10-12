import { SCENE_THEMES } from "@/config/scene-themes";

export const PREMIUM_OFFER_LOGO_GRADIENT = SCENE_THEMES.cloudy.gradient.slice(-4) as [string, string, ...string[]];
export const PREMIUM_OFFER_ACCENT = PREMIUM_OFFER_LOGO_GRADIENT[3];
// Equivalent to a 45% black overlay, applied only to the background.
export const PREMIUM_OFFER_BACKGROUND = SCENE_THEMES.cloudy.gradient.map(
  (color) => "#" + [1, 3, 5].map((offset) =>
    Math.round(parseInt(color.slice(offset, offset + 2), 16) * 0.55)
      .toString(16).padStart(2, "0")
  ).join(""),
) as [string, string, ...string[]];
export const PREMIUM_OFFER_LOCATIONS = SCENE_THEMES.cloudy.gradientLocations;