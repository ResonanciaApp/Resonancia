/**
 * MAPA DE AUDIO — RESONANCE
 * ─────────────────────────────────────────────────────────────────
 * Para agregar audio a una sesión:
 *
 *   1. Sube tu archivo .mp3 a:  artifacts/mobile/assets/audio/
 *   2. En este archivo, agrega una línea con el ID de la sesión:
 *
 *        "1": require("@/assets/audio/tu-archivo.mp3"),
 *
 *   3. Guarda. El reproductor usará el audio automáticamente.
 *
 * Los IDs de sesión corresponden a los definidos en data/sessions.ts.
 * ─────────────────────────────────────────────────────────────────
 */

export const AUDIO_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  "1": require("@/assets/audio/62 CM.mp3"),
  "20": require("@/assets/audio/sesion2_pad_mi_mayor.mp3"),
  "22": require("@/assets/audio/rio_orilla_mar.wav"),
  "27": require("@/assets/audio/riachuelo_stream.mp3"),
  "28": require("@/assets/audio/sesion_cuencos_mix.mp3"),
  "29": require("@/assets/audio/prueba1.mp3"),
  "30": require("@/assets/audio/prueba1.mp3"),
};

/**
 * AMBIENT_MAP — capa de sonido ambiente superpuesta al audio base.
 * El usuario puede ajustar el volumen de esta capa independientemente.
 * Ejemplo: pájaros sobre el riachuelo.
 */
export const AMBIENT_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  "27": require("@/assets/audio/pajaros_ambiente.mp3"),
  "30": require("@/assets/audio/voz.mp3"),
};

/**
 * LOOP_SESSIONS — IDs de sesiones que deben reproducirse en loop indefinido.
 * El usuario elige la duración total antes de reproducir.
 * Solo las sesiones "Sonidos Naturaleza" de Música y Sonidos son loops.
 * Las de "Música Ambient" / "Música Enteógena" son pistas con duración fija.
 */
export const LOOP_SESSIONS = new Set(["20", "21", "22", "27"]);

/**
 * VOICE_MAP — audio de voz guiada superpuesto al fondo musical.
 * Solo para sesiones de Meditaciones Guiadas.
 */
export const VOICE_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  "28": require("@/assets/audio/meditacion_voz_profunda.mp3"),
  "29": require("@/assets/audio/voz.mp3"),
};

/**
 * Etiqueta de voz mostrada en las cards ("Guiada" / "Sin voz" / vacío).
 * - `voiceTag === undefined` → sesión bundleada: caption derivado de VOICE_MAP.
 * - `voiceTag === null` → sesión de DB sin etiqueta: caption vacío.
 * - `voiceTag` con valor → caption fijado por el admin.
 */
export function getVoiceLabel(session: {
  id: string;
  voiceTag?: "Guiada" | "Sin voz" | null;
}): string | null {
  if (session.voiceTag === undefined) {
    return session.id in VOICE_MAP ? "Guiada" : "Sin voz";
  }
  return session.voiceTag ?? null;
}
