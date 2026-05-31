/**
 * MAPA DE SONIDOS — MIXER "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * Cada clave corresponde a un `id` de sonido definido en data/sounds.ts.
 *
 * Para activar un sonido en el mixer:
 *
 *   1. Sube tu loop .mp3 a:  artifacts/mobile/assets/audio/mixer/
 *      (deben ser loops limpios, sin cortes audibles al repetirse)
 *
 *   2. Descomenta / agrega la línea con el id del sonido:
 *
 *        lluvia: require("@/assets/audio/mixer/lluvia.mp3"),
 *
 *   3. Guarda. El sonido pasa de "Próximamente" a reproducible
 *      automáticamente en la pantalla "Mi Música".
 *
 * Mientras un id NO tenga archivo aquí, su card aparece como
 * "Próximamente" (deshabilitada) — así la biblioteca se ve completa
 * antes de cargar los audios.
 * ─────────────────────────────────────────────────────────────────
 */
export const SOUND_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  // ── Naturaleza ──────────────────────────────────────────────
  lluvia: require("@/assets/audio/mixer/lluvia.mp3"),
  // tormenta: require("@/assets/audio/mixer/tormenta.mp3"),
  oceano: require("@/assets/audio/mixer/oceano.mp3"),
  // rio: require("@/assets/audio/mixer/rio.mp3"),
  viento: require("@/assets/audio/mixer/viento.mp3"),
  fogata: require("@/assets/audio/mixer/fogata.mp3"),
  // bosque: require("@/assets/audio/mixer/bosque.mp3"),
  // noche: require("@/assets/audio/mixer/noche.mp3"),
  // ── Tonales ─────────────────────────────────────────────────
  ruido_blanco: require("@/assets/audio/mixer/ruido_blanco.mp3"),
  // ruido_rosa: require("@/assets/audio/mixer/ruido_rosa.mp3"),
  // ruido_marron: require("@/assets/audio/mixer/ruido_marron.mp3"),
  cuencos: require("@/assets/audio/mixer/cuencos.mp3"),
  // drone: require("@/assets/audio/mixer/drone.mp3"),
  // ── Lugares ─────────────────────────────────────────────────
  // cafe: require("@/assets/audio/mixer/cafe.mp3"),
  // tren: require("@/assets/audio/mixer/tren.mp3"),
};
