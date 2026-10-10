/** Shared glass surface used by the horizontal tab bar and mixer miniplayer. */
export const TAB_BAR_NAVIGATION_HEIGHT = 43;
export const TAB_BAR_GLASS_OVERLAY = "rgba(14,8,33,0.62)";
export const TAB_BAR_BLUR_INTENSITY = 48;
export const TAB_BAR_INACTIVE_COLOR = "rgba(190,180,207,0.96)";

/** Natural keeps the same glass opacity while changing only its tint. */
export function getTabBarGlassOverlay(themeId: string): string {
  return themeId === "natural" ? "rgba(8,33,28,0.62)" : TAB_BAR_GLASS_OVERLAY;
}

/** Exact theme palettes; Cloudy variants do not inherit each other's tint. */
export function getTabBarInactiveColor(themeId: string): string {
  if (themeId === "natural") return "#D5EBDD";
  if (themeId === "cloudy") return "#D5E5F2";
  if (themeId === "indigo2") return "#DED5F2";
  return TAB_BAR_INACTIVE_COLOR;
}