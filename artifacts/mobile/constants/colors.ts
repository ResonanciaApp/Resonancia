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

export const WIDGET_GREEN_SOLID = "#298B73";

export const MEMBERSHIP_AURORA = {
  background: "#111B2B",
  panel: "rgba(20,31,46,0.78)",
  panelMuted: "rgba(20,31,46,0.72)",
  text: "#F7F2E8",
  textSoft: "#D4DDDA",
  textMuted: "#AAB9BE",
  teal: "#91D2C7",
  tealGlow: "rgba(29,166,145,0.28)",
  premium: {
    accent: "#E7B95C",
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
