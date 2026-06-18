/**
 * MAPA DE IMÁGENES DE FONDO — MIXER "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * Cada clave corresponde a un `id` de sonido (data/sounds.ts).
 * Imágenes en: artifacts/mobile/assets/images/mixer/
 * ─────────────────────────────────────────────────────────────────
 */
export const SOUND_IMAGE_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  // ── Naturaleza ──────────────────────────────────────────────
  viento:   require("@/assets/images/mixer/viento.jpg"),
  fogata:   require("@/assets/images/mixer/fogata.jpg"),
  bosque:   require("@/assets/images/mixer/bosque.jpg"),
  noche:    require("@/assets/images/mixer/noche.jpg"),
  tormenta: require("@/assets/images/mixer/tormenta.jpg"),
  pajaros:  require("@/assets/images/mixer/pajaros.jpg"),
  grillos:  require("@/assets/images/mixer/grillos.jpg"),

  // ── Agua ────────────────────────────────────────────────────
  lluvia:   require("@/assets/images/mixer/lluvia.jpg"),
  oceano:   require("@/assets/images/mixer/oceano.jpg"),
  rio:      require("@/assets/images/mixer/rio.jpg"),
  arroyo:   require("@/assets/images/mixer/arroyo.jpg"),
  cascada:  require("@/assets/images/mixer/cascada.jpg"),

  // ── Cuencos Tibetanos ───────────────────────────────────────
  cuencos:      require("@/assets/images/mixer/cuencos.jpg"),
  cuenco_grave: require("@/assets/images/mixer/cuenco_grave.jpg"),
  cuenco_agudo: require("@/assets/images/mixer/cuenco_agudo.jpg"),

  // ── Cuencos de Cuarzo ───────────────────────────────────────
  cuarzo_do:      require("@/assets/images/mixer/cuarzo.jpg"),
  cuarzo_sol:     require("@/assets/images/mixer/cuarzo_sol.jpg"),
  cuarzo_corazon: require("@/assets/images/mixer/cuarzo_corazon.jpg"),

  // ── Gongs ───────────────────────────────────────────────────
  gong:            require("@/assets/images/mixer/gong.jpg"),
  gong_planetario: require("@/assets/images/mixer/gong_planetario.jpg"),

  // ── Campanas de Viento ──────────────────────────────────────
  campanas_viento: require("@/assets/images/mixer/campanas.jpg"),
  campanas_bambu:  require("@/assets/images/mixer/campanas_bambu.jpg"),

  // ── Mantras ─────────────────────────────────────────────────
  mantra_om:    require("@/assets/images/mixer/mantra.jpg"),
  mantra_soham: require("@/assets/images/mixer/mantra_soham.jpg"),

  // ── Solfeggio ───────────────────────────────────────────────
  solfeggio_528: require("@/assets/images/mixer/solfeggio.jpg"),
  solfeggio_432: require("@/assets/images/mixer/solfeggio_432.jpg"),
  solfeggio_396: require("@/assets/images/mixer/solfeggio_396.jpg"),

  // ── Ruidos ──────────────────────────────────────────────────
  ruido_blanco: require("@/assets/images/mixer/ruido_blanco.jpg"),
  ruido_rosa:   require("@/assets/images/mixer/ruido_rosa.jpg"),
  ruido_marron: require("@/assets/images/mixer/ruido_marron.jpg"),
  ruido_azul:   require("@/assets/images/mixer/ruido_azul.jpg"),
  drone:        require("@/assets/images/mixer/drone.jpg"),

  // ── Frecuencias (ondas cerebrales) ──────────────────────────
  onda_delta: require("@/assets/images/mixer/frecuencias.jpg"),
  onda_theta: require("@/assets/images/mixer/onda_theta.jpg"),
  onda_alpha: require("@/assets/images/mixer/onda_alpha.jpg"),
  onda_beta:  require("@/assets/images/mixer/onda_beta.jpg"),
  onda_gamma: require("@/assets/images/mixer/onda_gamma.jpg"),

  // ── Lugares ─────────────────────────────────────────────────
  cafe: require("@/assets/images/mixer/cafe.jpg"),
  tren: require("@/assets/images/mixer/tren.jpg"),

  // ── Binaurales ──────────────────────────────────────────────
  binaural_1: require("@/assets/images/mixer/binaural_1_opt.jpg"),
  binaural_2: require("@/assets/images/mixer/binaural_2_opt.jpg"),
  binaural_3: require("@/assets/images/mixer/binaural_3_opt.jpg"),
  binaural_4: require("@/assets/images/mixer/binaural_4_opt.jpg"),
  binaural_5: require("@/assets/images/mixer/binaural_5_opt.jpg"),
};

export function getSoundImage(id: string): ReturnType<typeof require> | undefined {
  return SOUND_IMAGE_MAP[id];
}
