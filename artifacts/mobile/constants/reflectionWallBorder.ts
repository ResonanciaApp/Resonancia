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
/** Cloudy: +5% RGB brightness on blue/purple stops only; warm stops unchanged. */
export const CLOUDY_REFLECTION_WALL_BORDER_GRADIENT: [string, string, ...string[]] = [
  "#5175B0",
  "#627FCA",
  "#7B74CB",
  "#9870BE",
  ...REFLECTION_WALL_BORDER_GRADIENT.slice(4),
];
export const REFLECTION_WALL_BORDER_END = { x: 1, y: 0.5 };
export const REFLECTION_WALL_BORDER_BRIGHTNESS = 0.9603 * 1.05;