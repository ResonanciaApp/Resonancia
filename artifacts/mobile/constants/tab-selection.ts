export const TAB_SELECTION_HEIGHT = 50;
export const TAB_SELECTION_INSET = -1;
export const TAB_ROW_PADDING = 7;
export const TAB_SELECTION_BACKGROUND = "rgba(255,255,255,0.1)";

export function tabSelectionSpring(distanceInTabs: number) {
  "worklet";
  const distance = Math.min(4, Math.abs(distanceInTabs));
  return {
    stiffness: 280,
    damping: 29 - distance * 1.6,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
  };
}
