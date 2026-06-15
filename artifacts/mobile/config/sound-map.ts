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
 *   2. Agrega la línea con el id del sonido:
 *
 *        lluvia: require("@/assets/audio/mixer/lluvia.mp3"),
 *
 *   3. Guarda. El sonido pasa a reproducible automáticamente.
 * ─────────────────────────────────────────────────────────────────
 */
export const SOUND_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  // ── Naturaleza ──────────────────────────────────────────────
  viento:   require("@/assets/audio/mixer/viento.mp3"),
  fogata:   require("@/assets/audio/mixer/fogata.mp3"),
  bosque:   require("@/assets/audio/mixer/bosque.mp3"),
  noche:    require("@/assets/audio/mixer/noche.mp3"),
  tormenta: require("@/assets/audio/mixer/tormenta.mp3"),
  pajaros:  require("@/assets/audio/mixer/pajaros.mp3"),
  grillos:  require("@/assets/audio/mixer/grillos.mp3"),

  // ── Agua ────────────────────────────────────────────────────
  lluvia:   require("@/assets/audio/mixer/lluvia.mp3"),
  oceano:   require("@/assets/audio/mixer/oceano.mp3"),
  rio:      require("@/assets/audio/mixer/rio.mp3"),
  arroyo:   require("@/assets/audio/mixer/arroyo.mp3"),
  cascada:  require("@/assets/audio/mixer/cascada.mp3"),

  // ── Cuencos Tibetanos ───────────────────────────────────────
  cuencos:      require("@/assets/audio/mixer/cuencos.mp3"),
  cuenco_grave: require("@/assets/audio/mixer/cuenco_grave.mp3"),
  cuenco_agudo: require("@/assets/audio/mixer/cuenco_agudo.mp3"),

  // ── Cuencos de Cuarzo ───────────────────────────────────────
  cuarzo_do:      require("@/assets/audio/mixer/cuarzo_do.mp3"),
  cuarzo_sol:     require("@/assets/audio/mixer/cuarzo_sol.mp3"),
  cuarzo_corazon: require("@/assets/audio/mixer/cuarzo_corazon.mp3"),

  // ── Gongs ───────────────────────────────────────────────────
  gong:            require("@/assets/audio/mixer/gong.mp3"),
  gong_planetario: require("@/assets/audio/mixer/gong_planetario.mp3"),

  // ── Campanas de Viento ──────────────────────────────────────
  campanas_viento: require("@/assets/audio/mixer/campanas_viento.mp3"),
  campanas_bambu:  require("@/assets/audio/mixer/campanas_bambu.mp3"),

  // ── Mantras ─────────────────────────────────────────────────
  mantra_om:    require("@/assets/audio/mixer/mantra_om.mp3"),
  mantra_soham: require("@/assets/audio/mixer/mantra_soham.mp3"),

  // ── Solfeggio ───────────────────────────────────────────────
  solfeggio_528: require("@/assets/audio/mixer/solfeggio_528.mp3"),
  solfeggio_432: require("@/assets/audio/mixer/solfeggio_432.mp3"),
  solfeggio_396: require("@/assets/audio/mixer/solfeggio_396.mp3"),

  // ── Ruidos (de color) ───────────────────────────────────────
  ruido_blanco: require("@/assets/audio/mixer/ruido_blanco.mp3"),
  ruido_rosa:   require("@/assets/audio/mixer/ruido_rosa.mp3"),
  ruido_marron: require("@/assets/audio/mixer/ruido_marron.mp3"),
  ruido_azul:   require("@/assets/audio/mixer/ruido_azul.mp3"),

  // ── Frecuencias (ondas cerebrales isocrónicas) ──────────────
  onda_delta: require("@/assets/audio/mixer/onda_delta.mp3"),
  onda_theta: require("@/assets/audio/mixer/onda_theta.mp3"),
  onda_alpha: require("@/assets/audio/mixer/onda_alpha.mp3"),
  onda_beta:  require("@/assets/audio/mixer/onda_beta.mp3"),
  onda_gamma: require("@/assets/audio/mixer/onda_gamma.mp3"),

  // ── BPM (loops sintéticos — reemplazar con masters de producción) ──
  // Duración exacta de 2 compases en 4/4:
  //   90 BPM  → 5.333 s  |  100 BPM → 4.800 s  |  120 BPM → 4.000 s
  kick_90:           require("@/assets/audio/mixer/bpm/kick_90.mp3"),
  snare_90:          require("@/assets/audio/mixer/bpm/snare_90.mp3"),
  hihat_90:          require("@/assets/audio/mixer/bpm/hihat_90.mp3"),
  shaker_90:         require("@/assets/audio/mixer/bpm/shaker_90.mp3"),
  tambor_90:         require("@/assets/audio/mixer/bpm/tambor_90.mp3"),

  kick_100:          require("@/assets/audio/mixer/bpm/kick_100.mp3"),
  snare_100:         require("@/assets/audio/mixer/bpm/snare_100.mp3"),
  hihat_100:         require("@/assets/audio/mixer/bpm/hihat_100.mp3"),
  rimshot_100:       require("@/assets/audio/mixer/bpm/rimshot_100.mp3"),
  shaker_100:        require("@/assets/audio/mixer/bpm/shaker_100.mp3"),

  kick_120:          require("@/assets/audio/mixer/bpm/kick_120.mp3"),
  snare_120:         require("@/assets/audio/mixer/bpm/snare_120.mp3"),
  hihat_cerrado_120: require("@/assets/audio/mixer/bpm/hihat_cerrado_120.mp3"),
  hihat_abierto_120: require("@/assets/audio/mixer/bpm/hihat_abierto_120.mp3"),
  clap_120:          require("@/assets/audio/mixer/bpm/clap_120.mp3"),
  tambor_120:        require("@/assets/audio/mixer/bpm/tambor_120.mp3"),
};
