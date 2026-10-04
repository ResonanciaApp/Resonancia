/** Time-scale the entire opening to 90% speed while preserving the spring's shape. */
export const DURATION_SHEET_OPEN_SPEED = 0.9;

// React Native converts the previous tension 55 / friction 8 to stiffness 284.5 / damping 25.
// For x_new(t) = x_old(speed * t), stiffness scales by speed² and damping by speed.
export const DURATION_SHEET_OPEN_SPRING = {
  stiffness: 284.5 * DURATION_SHEET_OPEN_SPEED ** 2,
  damping: 25 * DURATION_SHEET_OPEN_SPEED,
  mass: 1,
  restSpeedThreshold: 0.001 * DURATION_SHEET_OPEN_SPEED,
};

export const DURATION_SHEET_OPEN_BACKDROP_MS = Math.round(500 / DURATION_SHEET_OPEN_SPEED);