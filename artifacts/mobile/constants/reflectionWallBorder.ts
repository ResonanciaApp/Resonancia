import {
  MOOD_HISTORY_GRADIENT_START,
  MOOD_HISTORY_GRADIENT_END,
} from "./moodHistoryGradient.ts";

export const REFLECTION_WALL_BORDER_BASE_GRADIENT: [string, string, ...string[]] = [
  "#4D97A8",
  "#4D8EA8",
  "#4D70A8",
  "#566BB6",
  "#5D6EC0",
  "#756EC1",
  "#916BB5",
  "#AA7BA0",
];

export const REFLECTION_WALL_BORDER_GRADIENT = REFLECTION_WALL_BORDER_BASE_GRADIENT.map(hex =>
  `#${[1, 3, 5].map(index =>
    Math.min(255, Math.round(parseInt(hex.slice(index, index + 2), 16) * 1.25))
      .toString(16).padStart(2, "0"),
  ).join("").toUpperCase()}`,
) as [string, string, ...string[]];
export const CLOUDY_REFLECTION_WALL_BORDER_GRADIENT = REFLECTION_WALL_BORDER_GRADIENT;
export const REFLECTION_WALL_BORDER_LOCATIONS = REFLECTION_WALL_BORDER_BASE_GRADIENT.map(
  (_, index) => index / (REFLECTION_WALL_BORDER_BASE_GRADIENT.length - 1),
) as [number, number, ...number[]];
export const REFLECTION_WALL_BORDER_START = MOOD_HISTORY_GRADIENT_START;
export const REFLECTION_WALL_BORDER_END = MOOD_HISTORY_GRADIENT_END;
export const REFLECTION_WALL_BORDER_BRIGHTNESS = 1;