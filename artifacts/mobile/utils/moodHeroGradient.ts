/** Shared overlay for the final emotional check-in screen and its matching heroes. */
export function getMoodHeroGradient(fadeColor: string, heroHeight: number) {
  const colorWithOpacity = (opacity: number) => {
    const match = fadeColor.match(/^#([0-9a-f]{6})$/i);
    if (!match) return fadeColor;
    const alpha = Math.round(Math.max(0, Math.min(1, opacity)) * 255)
      .toString(16)
      .padStart(2, "0");
    return `#${match[1]}${alpha}`;
  };
  return {
    colors: [colorWithOpacity(0), colorWithOpacity(0.3), fadeColor, fadeColor] as [string, string, ...string[]],
    locations: [0.3, 0.7, Math.max(0.7, 1 - 55 / heroHeight), 1] as [number, number, ...number[]],
  };
}