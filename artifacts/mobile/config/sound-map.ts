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
  viento: require("@/assets/audio/mixer/viento.mp3"),
  fogata: require("@/assets/audio/mixer/fogata.mp3"),
  // bosque: require("@/assets/audio/mixer/bosque.mp3"),
  // noche: require("@/assets/audio/mixer/noche.mp3"),
  // tormenta: require("@/assets/audio/mixer/tormenta.mp3"),
  // pajaros: require("@/assets/audio/mixer/pajaros.mp3"),
  // grillos: require("@/assets/audio/mixer/grillos.mp3"),
  // ── Agua ────────────────────────────────────────────────────
  lluvia: require("@/assets/audio/mixer/lluvia.mp3"),
  oceano: require("@/assets/audio/mixer/oceano.mp3"),
  // rio: require("@/assets/audio/mixer/rio.mp3"),
  // arroyo: require("@/assets/audio/mixer/arroyo.mp3"),
  // cascada: require("@/assets/audio/mixer/cascada.mp3"),
  // ── Cuencos Tibetanos ───────────────────────────────────────
  cuencos: require("@/assets/audio/mixer/cuencos.mp3"),
  // cuenco_grave: require("@/assets/audio/mixer/cuenco_grave.mp3"),
  // cuenco_agudo: require("@/assets/audio/mixer/cuenco_agudo.mp3"),
  // ── Cuencos de Cuarzo ───────────────────────────────────────
  // cuarzo_do: require("@/assets/audio/mixer/cuarzo_do.mp3"),
  // cuarzo_sol: require("@/assets/audio/mixer/cuarzo_sol.mp3"),
  // cuarzo_corazon: require("@/assets/audio/mixer/cuarzo_corazon.mp3"),
  // ── Gongs ───────────────────────────────────────────────────
  // gong: require("@/assets/audio/mixer/gong.mp3"),
  // gong_planetario: require("@/assets/audio/mixer/gong_planetario.mp3"),
  // ── Campanas de Viento ──────────────────────────────────────
  // campanas_viento: require("@/assets/audio/mixer/campanas_viento.mp3"),
  // campanas_bambu: require("@/assets/audio/mixer/campanas_bambu.mp3"),
  // ── Mantras ─────────────────────────────────────────────────
  // mantra_om: require("@/assets/audio/mixer/mantra_om.mp3"),
  // mantra_soham: require("@/assets/audio/mixer/mantra_soham.mp3"),
  // ── Solfeggio ───────────────────────────────────────────────
  // solfeggio_528: require("@/assets/audio/mixer/solfeggio_528.mp3"),
  // solfeggio_432: require("@/assets/audio/mixer/solfeggio_432.mp3"),
  // solfeggio_396: require("@/assets/audio/mixer/solfeggio_396.mp3"),
};
