/**
 * Coordinador de audio: la sesión (PlayerContext) y la mezcla (MixerContext)
 * son mutuamente excluyentes — comparten el slot de "Now Playing" / pantalla
 * bloqueada, así que solo una puede sonar a la vez.
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

/** Detiene la sesión que estuviera sonando (llamar al iniciar una mezcla o un sonido de Descanso). */
export function stopSessionPlayback() {
  try {
    sessionStopper?.();
  } catch {
    // ignore
  }
}

/** Detiene la mezcla que estuviera sonando (llamar al iniciar una sesión). */
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
