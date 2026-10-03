export const CLOUDY_BLACK_SURFACE = "rgba(0,0,0,0.19)";

function isBlack16(color: unknown): boolean {
  if (typeof color !== "string") return false;
  const match = color.match(/^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*([\d.]+)\s*\)$/i);
  return !!match && Number(match[1]) === 0.16;
}

export function isBlack16Background(color: unknown): boolean {
  if (isBlack16(color)) return true;
  // Two older headers interpolate between identical black-16 endpoints.
  // Replacing that constant background does not change their scroll animation.
  if (color && typeof color === "object" && "_config" in color) {
    const range = (color as { _config?: { outputRange?: unknown[] } })._config?.outputRange;
    return !!range?.length && range.every(isBlack16);
  }
  return false;
}

/** Only backgroundColor changes. Borders, opacity, shadows and gradients do not. */
export function resolveCloudySurfaceStyle(
  style: any,
  cloudy: boolean,
  flatten: (style: any) => any,
): any {
  if (!cloudy || style == null) return style;
  if (typeof style === "function") {
    return (state: any) => resolveCloudySurfaceStyle(style(state), true, flatten);
  }
  if (!isBlack16Background(flatten(style)?.backgroundColor)) return style;
  return [style, { backgroundColor: CLOUDY_BLACK_SURFACE }];
}