/**
 * mixBlackTint — negro con 0.14 de opacidad, tintado con un 5% del color
 * más oscuro pasado (p. ej. el stop más oscuro del degradado de la Escena
 * activa). Usado en los íconos principales de las pantallas de categoría
 * (Música, Meditaciones, Sesiones) para que el fondo del ícono responda
 * sutilmente al tema activo sin perder el negro base.
 */
export function mixBlackTint(darkColor: string, tintRatio = 0.05, alpha = 0.14): string {
  const hex = darkColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const mr = Math.round(r * tintRatio);
  const mg = Math.round(g * tintRatio);
  const mb = Math.round(b * tintRatio);
  return `rgba(${mr},${mg},${mb},${alpha})`;
}
