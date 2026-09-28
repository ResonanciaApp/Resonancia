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
export const CARD_TEXT_ABOVE = "#D1D1D1";
export const CARD_TEXT_BELOW = "#EBF2FF";
export const DISCOVER_SEARCH_SURFACE = "rgba(0,0,0,0.33)";
export const INSPIRATION_SKY = "#7DD3FC";
export const POSITIONED_DAY_GRADIENT = ["#9380E7", "#9EA5EF"] as const;
export const EDITORIAL_PLAYLIST_GRADIENT = ["#363459", "#231E53", "#2B1E53", "#2E1E53"] as const;
export const NOTIFICATIONS_GRADIENT = ["#231E53", "#2B1E53"] as const;
export const PREMIUM_STAR_GRADIENT = ["#FFD848", "#FCC200", "#F6BA00"] as const;

export const MEMBERSHIP_AURORA = {
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
