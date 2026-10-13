/** Legacy mini-player glass; the floating tab pill has its own stronger tint. */
export const TAB_BAR_GLASS_OVERLAY = "rgba(14,8,33,0.62)";
export const TAB_BAR_BLUR_INTENSITY = 48;
export const TAB_BAR_INACTIVE_COLOR = "rgba(190,180,207,0.96)";

/** Floating tab pill: mirrors the Inicio hero emotion widget glass (inicio8). */
export const TAB_PILL_BLUR_INTENSITY = 38;
export const TAB_PILL_BLUR_TINT = "light" as const;
export const TAB_PILL_GLASS_OVERLAY = "rgba(14,8,33,0.744)";
export const TAB_PILL_SIDE_MARGIN = 16;
export const TAB_PILL_BAR_H = 58;

/** Natural keeps the same glass opacity while changing only its tint. */
export function getTabBarGlassOverlay(themeId: string): string {
  if (themeId === "galactic") return "rgba(9,18,41,0.744)";
  if (themeId === "fuego") return "rgba(33,16,8,0.744)";
  return themeId === "natural" ? "rgba(8,33,28,0.744)" : TAB_PILL_GLASS_OVERLAY;
}

/** Exact theme palettes; Cloudy variants do not inherit each other's tint. */
export function getTabBarInactiveColor(themeId: string): string {
  if (themeId === "fuego") return "#F2DDD5";
  if (themeId === "natural") return "#D5EBDD";
  if (themeId === "cloudy" || themeId === "galactic") return "#D5E5F2";
  if (themeId === "indigo2") return "#DED5F2";
  return TAB_BAR_INACTIVE_COLOR;
}