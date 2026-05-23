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
 * IDs de sesiones disponibles:
 *   "1"  → Inner Journey (Tibetan Bowl Session · 30 min)
 *   "2"  → Golden Sleep (Deep Rest Session · 45 min)
 *   "3"  → Cosmic Gong Bath (Gong Session · 60 min)
 *   "4"  → Morning Presence (Guided Meditation · 15 min)
 *   "5"  → Crystal Clarity (Crystal Bowl · 25 min)
 *   "6"  → Breath of Peace (Breathwork · 12 min)
 *   "7"  → Anxiety Dissolve (Emotional Healing · 20 min)
 *   "8"  → Still Waters (Conscious Pause · 5 min)
 *   "9"  → Deep Delta Sleep (Sleep · 60 min)
 *   "10" → Grounded Clarity (Focus · 20 min)
 *   "11" → Sound Healing Journey (Full Session · 50 min)
 *   "12" → Moonrise Rest (Sleep · 90 min)
 *   "13" → Tibetan Sunrise (Morning Ritual · 18 min)
 *   "14" → Harmonic Release (Sound Healing · 35 min)
 *   "15" → Sacred Pause (Midday Reset · 8 min)
 * ─────────────────────────────────────────────────────────────────
 */

export const AUDIO_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  "1": require("@/assets/audio/62 CM.mp3"),
  "2": require("@/assets/audio/sesion2_pad_mi_mayor.mp3"),
  "3": require("@/assets/audio/62 CM.mp3"),
  "20": require("@/assets/audio/sesion2_pad_mi_mayor.mp3"),
  "27": require("@/assets/audio/riachuelo_stream.mp3"),
  "28": require("@/assets/audio/sesion_cuencos_mix.mp3"),
};

/**
 * AMBIENT_MAP — capa de sonido ambiente superpuesta al audio base.
 * El usuario puede ajustar el volumen de esta capa independientemente.
 * Ejemplo: pájaros sobre el riachuelo.
 */
export const AMBIENT_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  "27": require("@/assets/audio/pajaros_ambiente.mp3"),
};

/**
 * LOOP_SESSIONS — IDs de sesiones que deben reproducirse en loop indefinido.
 * El usuario elige la duración total antes de reproducir.
 */
export const LOOP_SESSIONS = new Set(["20", "21", "22", "23", "24", "25", "26", "27"]);

/**
 * VOICE_MAP — audio de voz guiada superpuesto al fondo musical.
 * Solo para sesiones de Meditaciones Guiadas.
 */
export const VOICE_MAP: Record<string, ReturnType<typeof require> | undefined> = {
  "28": require("@/assets/audio/meditacion_voz_profunda.mp3"),
};
