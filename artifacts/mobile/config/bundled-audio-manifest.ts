/**
 * Fuente de verdad compartida para los audios que viajan dentro de la app.
 * El API la usa al validar `bundle:<sessionId>` y AUDIO_MAP la tipa para que
 * una entrada del manifiesto nunca se publique sin su asset nativo.
 */
export const BUNDLED_AUDIO_SESSION_IDS = [
  "1",
  "20",
  "21",
  "22",
  "27",
  "28",
  "29",
  "30",
] as const;

export type BundledAudioSessionId = (typeof BUNDLED_AUDIO_SESSION_IDS)[number];