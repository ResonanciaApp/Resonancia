import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";

// Audio del "logo reveal" (cubo-3) de Geometrix. El player es un singleton a
// nivel de módulo, NO un ref del componente, por dos razones:
//
//  1. La pestaña Geometrix se monta de forma perezosa (lazy) en su primer foco,
//     así que precargar al montar el componente llegaba tarde (decode recién al
//     entrar → ~5s de delay). Precargamos al ARRANQUE de la app (root layout),
//     con segundos de anticipación, para que el primer play sea instantáneo y
//     sincronice con el FadeIn del logo.
//
//  2. El sonido debe oírse UNA sola vez por lanzamiento de app. El flag `played`
//     vive en el módulo: persiste entre focos/blur de la pestaña, pero se
//     resetea cuando la app se reinicia (el módulo se recarga). Así suena solo
//     la primera vez que el usuario abre la app y entra a Geometrix; si se va y
//     vuelve, ya no suena.

let player: AudioPlayer | null = null;
let loadStarted = false;
let played = false;

/** Precarga el player de intro al arrancar la app. Idempotente. */
export function preloadGeometrixIntro() {
  if (loadStarted) return;
  setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {
    /* ignore */
  });
  try {
    const p = createAudioPlayer(
      require("../assets/audio/geometrix/intro-reveal.mp3"),
      { updateInterval: 500 },
    );
    p.volume = 1;
    player = p;
    // Solo bloqueamos tras una creación exitosa: si createAudioPlayer falla, un
    // próximo preload puede reintentar en este mismo lanzamiento.
    loadStarted = true;
  } catch {
    /* ignore */
  }
}

/** Reproduce el intro una sola vez por lanzamiento de app. */
export function playGeometrixIntroOnce() {
  if (played) return;
  const p = player;
  // Si el player aún no se precargó, NO consumimos el one-shot: se intentará en
  // el próximo foco. En un arranque normal ya está listo a esta altura.
  if (!p) return;
  try {
    // El player está fresco en la posición 0 → play arranca al instante, sin
    // await, para sincronizar con el FadeIn del logo.
    p.play();
    // Consumimos el one-shot solo si play() no lanzó: un error transitorio no
    // debe gastar la única reproducción del lanzamiento.
    played = true;
  } catch {
    /* ignore */
  }
}

/** Pausa el intro (no destruye el player; se libera al cerrar la app). */
export function stopGeometrixIntro() {
  const p = player;
  if (!p) return;
  try {
    p.pause();
  } catch {
    /* ignore */
  }
}
