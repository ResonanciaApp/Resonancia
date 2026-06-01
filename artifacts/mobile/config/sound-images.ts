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
  lluvia: require("@/assets/images/mixer/lluvia.jpg"),
  tormenta: require("@/assets/images/mixer/tormenta.jpg"),
  oceano: require("@/assets/images/mixer/oceano.jpg"),
  rio: require("@/assets/images/mixer/rio.jpg"),
  viento: require("@/assets/images/mixer/viento.jpg"),
  fogata: require("@/assets/images/mixer/fogata.jpg"),
  bosque: require("@/assets/images/mixer/bosque.jpg"),
  noche: require("@/assets/images/mixer/noche.jpg"),
  // ── Tonales ─────────────────────────────────────────────────
  ruido_blanco: require("@/assets/images/mixer/ruido_blanco.jpg"),
  ruido_rosa: require("@/assets/images/mixer/ruido_rosa.jpg"),
  ruido_marron: require("@/assets/images/mixer/ruido_marron.jpg"),
  cuencos: require("@/assets/images/mixer/cuencos.jpg"),
  drone: require("@/assets/images/mixer/drone.jpg"),
  // ── Lugares ─────────────────────────────────────────────────
  cafe: require("@/assets/images/mixer/cafe.jpg"),
  tren: require("@/assets/images/mixer/tren.jpg"),
};

export function getSoundImage(id: string): ReturnType<typeof require> | undefined {
  return SOUND_IMAGE_MAP[id];
}
