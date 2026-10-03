export const REFLECTION_WALL_BORDER_GRADIENT: [string, string, ...string[]] = [
  "#4D6FA8",
  "#5D79C0",
  "#756EC1",
  "#916BB5",
  "#AE719E",
  "#C18A82",
  "#D0A66F",
];

export const REFLECTION_WALL_BORDER_START = { x: 0, y: 0.5 };
/** Cloudy: original +5% RGB brightness, then another +3%; warm stops unchanged. */
export const CLOUDY_REFLECTION_WALL_BORDER_GRADIENT: [string, string, ...string[]] = [
  "#5379B5",
  "#6583D0",
  "#7F77D1",
  "#9D73C4",
  ...REFLECTION_WALL_BORDER_GRADIENT.slice(4),
];
export const REFLECTION_WALL_BORDER_END = { x: 1, y: 0.5 };
export const REFLECTION_WALL_BORDER_BRIGHTNESS = 0.9603 * 1.05;