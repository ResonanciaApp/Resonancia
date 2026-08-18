/**
 * Coordinador de audio: la sesión (PlayerContext), la mezcla (MixerContext),
 * los sonidos de Descanso y el audio del chat son mutuamente excluyentes.
 *
 * Como PlayerProvider envuelve a MixerProvider (y no al revés), no podemos
 * acoplarlos vía contexto en ambas direcciones. Este módulo singleton deja que
 * cada uno registre su "stopper" y que el otro lo invoque antes de empezar a
 * reproducir, sin importar el orden de montaje de los providers.
 */

type Stopper = () => void;

let sessionStopper: Stopper | null = null;
let mixStopper: Stopper | null = null;
let soundStopper: Stopper | null = null;
let chatStopper: Stopper | null = null;

export function registerSessionStopper(fn: Stopper | null) {
  sessionStopper = fn;
}

export function registerMixStopper(fn: Stopper | null) {
  mixStopper = fn;
}

/** Reproductor de sonidos de Descanso (Sonidos Binaurales/Ambientales) — también mutuamente excluyente con sesión/mezcla. */
export function registerSoundStopper(fn: Stopper | null) {
  soundStopper = fn;
}

/**
 * Audio del chat (mensajes de voz) — mutuamente excluyente con todo lo demás.
 * AudioAttachment registra el stopper al empezar a reproducir y lo limpia al pausar/desmontar.
 */
export function registerChatStopper(fn: Stopper | null) {
  chatStopper = fn;
}

/** Detiene la sesión que estuviera sonando (llamar al iniciar una mezcla, sonido de Descanso o audio de chat). */
export function stopSessionPlayback() {
  try {
    sessionStopper?.();
  } catch {
    // ignore
  }
}

/** Detiene la mezcla que estuviera sonando (llamar al iniciar una sesión, sonido de Descanso o audio de chat). */
export function stopMixPlayback() {
  try {
    mixStopper?.();
  } catch {
    // ignore
  }
}

/** Detiene el sonido de Descanso que estuviera sonando (llamar al iniciar una sesión o mezcla). */
export function stopSoundPlayback() {
  try {
    soundStopper?.();
  } catch {
    // ignore
  }
}

/** Detiene cualquier audio de chat que estuviera reproduciéndose (llamar al iniciar sesión/mezcla/sonido). */
export function stopChatPlayback() {
  try {
    chatStopper?.();
  } catch {
    // ignore
  }
}
