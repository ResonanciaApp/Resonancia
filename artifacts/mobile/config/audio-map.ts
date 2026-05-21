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

  // Agrega más aquí — descomenta y completa el nombre del archivo:
  "2": require("@/assets/audio/62 CM.mp3"),
  "3": require("@/assets/audio/62 CM.mp3"),
  // "4": require("@/assets/audio/62 cm.mp3"),
  // "5": require("@/assets/audio/crystal-clarity.mp3"),
  // "6": require("@/assets/audio/breath-of-peace.mp3"),
  // "7": require("@/assets/audio/anxiety-dissolve.mp3"),
  // "8": require("@/assets/audio/still-waters.mp3"),
  // "9": require("@/assets/audio/deep-delta-sleep.mp3"),
  // "10": require("@/assets/audio/grounded-clarity.mp3"),
  // "11": require("@/assets/audio/sound-healing-journey.mp3"),
  // "12": require("@/assets/audio/moonrise-rest.mp3"),
  // "13": require("@/assets/audio/tibetan-sunrise.mp3"),
  // "14": require("@/assets/audio/harmonic-release.mp3"),
  // "15": require("@/assets/audio/sacred-pause.mp3"),
};
