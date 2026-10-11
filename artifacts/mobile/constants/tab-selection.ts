export const TAB_SELECTION_HEIGHT = 50;
export const TAB_SELECTION_INSET = -2;
export const TAB_ROW_PADDING = 7;
export const TAB_SELECTION_BACKGROUND = "rgba(255,255,255,0.1)";

export function tabSelectionSpring(distanceInTabs: number, distanceInPixels = 0) {
  "worklet";
  const distance = Math.min(4, Math.abs(distanceInTabs));
  const stiffness = 280;
  let damping = 29 - Math.min(distance, 3) * 1.6 + Math.max(0, distance - 3) * 4.8;
  if (distance > 3 && distanceInPixels > 0) {
    // Calibrar el rebote extra en píxeles, no como porcentaje del ancho.
    const criticalDamping = 2 * Math.sqrt(stiffness);
    const ratio = damping / criticalDamping;
    const originalOvershoot = Math.exp(-Math.PI * ratio / Math.sqrt(1 - ratio * ratio));
    const desiredOvershoot = originalOvershoot + (distance - 3) / distanceInPixels;
    const decay = -Math.log(Math.min(0.5, desiredOvershoot));
    damping = criticalDamping * decay / Math.sqrt(Math.PI * Math.PI + decay * decay);
  }
  return {
    stiffness,
    // Mantener los saltos cortos; amortiguar más el recorrido entre extremos.
    damping,
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
