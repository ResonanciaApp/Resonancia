const colors = {
  light: {
    text: "#FFFFFF",
    tint: "#ACACC1",
    background: "#4A0C0C",
    foreground: "#FBFBFB",
    card: "rgba(74,12,12,0.08)",
    cardForeground: "#FBFBFB",
    primary: "#ACACC1",
    primaryForeground: "#1B060F",
    secondary: "#27070E",
    secondaryForeground: "#FBFBFB",
    muted: "#27070E",
    mutedForeground: "#F4F4F4",
    accent: "#ACACC1",
    accentForeground: "#1B060F",
    destructive: "#E63946",
    destructiveForeground: "#ffffff",
    border: "#3D0E16",
    input: "#27070E",
    warmIvory: "#FBFBFB",
    softSand: "#FBFBFB",
    acousticBronze: "rgba(250,240,238,0.45)",
    premiumGold: "#F9F9F9",
    deepBrown: "#27070E",
    darkChocolate: "rgba(74,12,12,0.08)",
    warmBlack: "#1B060F",
    goldenGlow: "#F9F9F9",
    copperLight: "#F9F9F9",
  },
  radius: 22,
};

export const WIDGET_GREEN_SOLID = "#F9F9F9";
export const CLOUDY_WIDGET_PLUS_GRADIENT = ["#2D2F7C", "#2D3981"] as const;
export const NATURAL_WIDGET_PLUS_GRADIENT = ["#52A855", "#52A855"] as const;
export const CLOUDY_GROWTH_STAGE_LABEL_COLOR = "#B5EFFF";
export const CLOUDY_GROWTH_ASCENT_TOGGLE_COLOR = "#F9F9F9";
export const CLOUDY_GROWTH_DAY_PILL_BACKGROUND = "rgba(128,171,231,0.20)";
export function getProfileSecondaryTextColor(themeId: string): string {
  return themeId === "cloudy" || themeId === "natural" ? "#D1D1D1" : "#C4C4C4";
}
export const REGISTER_BUTTON_ENABLED_BACKGROUND = "rgba(184, 117, 240, 0.45)";
export const CARD_TEXT_ABOVE = "#D1D1D1";
export const CARD_TEXT_BELOW = "#EBF2FF";
export const NAVIGATION_HELP_ICON_COLOR = "#F9F9F9";
export const STREAK_HISTORY_INFO_ICON_COLOR = "#B3B3B3";
export const DISCOVER_SEARCH_SURFACE = "rgba(0,0,0,0.33)";
export const INSPIRATION_SKY = "#7DD3FC";
export const POSITIONED_DAY_GRADIENT = ["#9380E7", "#9EA5EF"] as const;
export const EDITORIAL_PLAYLIST_GRADIENT = ["#363459", "#231E53", "#2B1E53", "#2E1E53"] as const;
export const NOTIFICATIONS_GRADIENT = ["#231E53", "#2B1E53"] as const;
export const SLEEP_REMINDER_NIGHT_GRADIENT = ["#0B0A26", "#08071C", "#070514"] as const;
export const SLEEP_REMINDER_CARD_BACKGROUND = "rgba(0,0,0,0.16)";
export const SLEEP_REMINDER_CONTINUE_BACKGROUND = "#94A6FF";
export const SLEEP_REMINDER_CONTINUE_FOREGROUND = "#0B0A26";
export const STREAK_INFO_COLORS = {
  foreground: "#F9F9F9",
  pageTitle: "#FBFBFB",
  fallbackBackground: "#0B1438",
  subtitle: "rgba(249,249,249,0.82)",
  description: "rgba(249,249,249,0.74)",
  footnote: "rgba(249,249,249,0.6)",
  cardBackground: "rgba(0,0,0,0.16)",
  imageMaskOpaque: "#FFFFFF",
  imageMaskTransparent: "#FFFFFF00",
  iconBackground: "rgba(255,255,255,0.1)",
  navigationBackground: "rgba(0,0,0,0.16)",
  navigationBorder: "transparent",
} as const;
export const PREMIUM_STAR_GRADIENT = ["#FFD848", "#FCC200", "#F6BA00"] as const;

export const MEMBERSHIP_AURORA = {
  trialButtonBackground: "#B9822F",
  textSoft: "#D4DDDA",
  textMuted: "#AAB9BE",
  premium: {
    accent: "#E7B95C",
    text: "#EDAE4E",
    soft: "#FFF1BF",
    border: "rgba(231,185,92,0.55)",
    glow: "rgba(231,185,92,0.18)",
  },
  plus: {
    accent: "#C9A6FF",
    soft: "#EADCFF",
    border: "rgba(183,132,255,0.7)",
    glow: "rgba(133,83,218,0.22)",
  },
} as const;

export default colors;
