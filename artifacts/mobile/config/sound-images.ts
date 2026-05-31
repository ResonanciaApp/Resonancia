/**
 * MAPA DE IMÁGENES DE FONDO — MIXER "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * Cada clave corresponde a un `id` de sonido (data/sounds.ts) y apunta
 * a la imagen de fondo de su card en la pantalla "Mi Música".
 *
 * Las imágenes viven en: artifacts/mobile/assets/images/mixer/
 * (a diferencia del audio, las imágenes SÍ se bundlean — son livianas).
 *
 * Si un id no tiene entrada aquí, su card cae al fondo sólido (colors.card).
 * ─────────────────────────────────────────────────────────────────
 */
export const SOUND_IMAGE_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  // ── Naturaleza ──────────────────────────────────────────────
  lluvia: require("@/assets/images/mixer/lluvia.png"),
  tormenta: require("@/assets/images/mixer/tormenta.png"),
  oceano: require("@/assets/images/mixer/oceano.png"),
  rio: require("@/assets/images/mixer/rio.png"),
  viento: require("@/assets/images/mixer/viento.png"),
  fogata: require("@/assets/images/mixer/fogata.png"),
  bosque: require("@/assets/images/mixer/bosque.png"),
  noche: require("@/assets/images/mixer/noche.png"),
  // ── Tonales ─────────────────────────────────────────────────
  ruido_blanco: require("@/assets/images/mixer/ruido_blanco.png"),
  ruido_rosa: require("@/assets/images/mixer/ruido_rosa.png"),
  ruido_marron: require("@/assets/images/mixer/ruido_marron.png"),
  cuencos: require("@/assets/images/mixer/cuencos.png"),
  drone: require("@/assets/images/mixer/drone.png"),
  // ── Lugares ─────────────────────────────────────────────────
  cafe: require("@/assets/images/mixer/cafe.png"),
  tren: require("@/assets/images/mixer/tren.png"),
};

export function getSoundImage(id: string): ReturnType<typeof require> | undefined {
  return SOUND_IMAGE_MAP[id];
}
