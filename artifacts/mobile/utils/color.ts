/**
 * mixBlackTint — negro con 0.95 de opacidad, tintado con un 10% del color
 * más oscuro pasado (p. ej. el stop más oscuro del degradado de la Escena
 * activa). Usado en los íconos principales de las pantallas de categoría
 * (Música, Meditaciones, Sesiones) para que el fondo del ícono responda
 * sutilmente al tema activo sin perder el negro base.
 */
export function mixBlackTint(darkColor: string, tintRatio = 0.10, alpha = 0.95): string {
  const hex = darkColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const mr = Math.round(r * tintRatio);
  const mg = Math.round(g * tintRatio);
  const mb = Math.round(b * tintRatio);
  return `rgba(${mr},${mg},${mb},${alpha})`;
}

/**
 * hexToRgba — convierte un color hex (#RRGGBB) a rgba(r,g,b,alpha).
 * Usado para aplicar el color más oscuro del tema activo directamente
 * (sin mezclar con negro) a un elemento, con una opacidad dada.
 */
export function hexToRgba(hex: string, alpha = 1): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}
