export const TAB_SELECTION_HEIGHT = 50;
export const TAB_SELECTION_INSET = -2;
export const TAB_ROW_PADDING = 7;
export const TAB_SELECTION_BACKGROUND = "rgba(255,255,255,0.1)";

export function tabSelectionSpring(distanceInTabs: number) {
  "worklet";
  const distance = Math.min(4, Math.abs(distanceInTabs));
  return {
    stiffness: 280,
    // Mantener los saltos cortos; amortiguar más el recorrido entre extremos.
    damping: 29 - Math.min(distance, 3) * 1.6 + Math.max(0, distance - 3) * 4.8,
    mass: 1,
    overshootClamping: false,
    restDisplacementThreshold: 0.1,
    restSpeedThreshold: 0.1,
  };
}

export function tabSelectionTranslation(position: number, slot: number, count: number) {
  "worklet";
  // El fondo nunca cruza el borde de la barra, incluso con velocidad heredada.
  const allowance = Math.max(0, TAB_ROW_PADDING + TAB_SELECTION_INSET - 1);
  const last = Math.max(0, count - 1) * slot;
  return Math.max(-allowance, Math.min(last + allowance, position));
}
