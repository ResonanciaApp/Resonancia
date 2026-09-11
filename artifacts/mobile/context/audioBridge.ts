/**
 * Coordinador de audio: la sesión (PlayerContext), la mezcla (MixerContext),
 * y el audio del chat son mutuamente excluyentes.
 *
 * Como PlayerProvider envuelve a MixerProvider (y no al revés), no podemos
 * acoplarlos vía contexto en ambas direcciones. Este módulo singleton deja que
 * cada uno registre su "stopper" y que el otro lo invoque antes de empezar a
 * reproducir, sin importar el orden de montaje de los providers.
 */

type Stopper = () => void;

let sessionStopper: Stopper | null = null;
let mixStopper: Stopper | null = null;
let chatStopper: Stopper | null = null;
let previewStopper: Stopper | null = null;

export function registerSessionStopper(fn: Stopper | null) {
  sessionStopper = fn;
}

export function registerMixStopper(fn: Stopper | null) {
  mixStopper = fn;
}

/**
 * Audio del chat (mensajes de voz) — mutuamente excluyente con todo lo demás.
 * AudioAttachment registra el stopper al empezar a reproducir y lo limpia al pausar/desmontar.
 */
export function registerChatStopper(fn: Stopper | null) {
  chatStopper = fn;
}

export function registerPreviewStopper(fn: Stopper | null) {
  previewStopper = fn;
}

/** Detiene la sesión que estuviera sonando (llamar al iniciar una mezcla o audio de chat). */
export function stopSessionPlayback() {
  try {
    sessionStopper?.();
    previewStopper?.();
  } catch {
    // ignore
  }
}

/** Detiene sesión, mezcla y chat antes de iniciar un preview, sin detener el preview nuevo. */
export function stopOtherAudioForPreview() {
  try { sessionStopper?.(); } catch {}
  try { mixStopper?.(); } catch {}
  try { chatStopper?.(); } catch {}
}

export function stopPreviewPlayback() {
  try {
    previewStopper?.();
  } catch {
    // ignore
  }
}

/** Detiene la mezcla que estuviera sonando (llamar al iniciar una sesión o audio de chat). */
export function stopMixPlayback() {
  try {
    mixStopper?.();
  } catch {
    // ignore
  }
}

/** Detiene cualquier audio de chat que estuviera reproduciéndose (llamar al iniciar sesión o mezcla). */
export function stopChatPlayback() {
  try {
    chatStopper?.();
  } catch {
    // ignore
  }
}
