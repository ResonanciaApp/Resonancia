import { SCENE_THEMES, PREMIUM_BACKGROUND_GRADIENT } from "@/config/scene-themes";

export const PREMIUM_OFFER_LOGO_GRADIENT = SCENE_THEMES.cloudy.gradient.slice(-4) as [string, string, ...string[]];
export const PREMIUM_OFFER_ACCENT = PREMIUM_OFFER_LOGO_GRADIENT[3];
// Equivalent to a 45% black overlay, applied only to the background.
export const PREMIUM_OFFER_BACKGROUND = PREMIUM_BACKGROUND_GRADIENT;
export const PREMIUM_OFFER_LOCATIONS = SCENE_THEMES.cloudy.gradientLocations;