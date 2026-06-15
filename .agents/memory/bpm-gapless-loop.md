---
name: BPM gapless rhythmic loop (mixer)
description: How rhythmic drum loops in the Mezclador loop gaplessly, on-tempo, and stay phase-locked across layers; why native loop, crossfade, and per-player listener-wrap all fail
---

# BPM gapless rhythmic loop

The Mezclador's rhythmic drum sounds (MixSound with `bpm`) must loop GAPLESS,
on-tempo, AND stay phase-locked when several are layered. Three approaches fail;
the working one is a single deterministic master clock.

## What does NOT work (and why)

- **Native loop (`player.loop = true`)** — expo-audio reinicia el loop esperando
  `AVPlayerItemDidPlayToEndTime` y recién ahí hace `seek(0)` + `play()`. Eso
  SIEMPRE deja un hueco audible. Sirve para texturas ambient continuas (el
  crossfade lo enmascara), pero para ritmo el hueco arruina el groove. Cambiar el
  formato (MP3→WAV) solo achica el hueco, no lo elimina.
- **El crossfade de dos capas (a/b) del mixer** — pensado para texturas
  continuas, NO para ritmo: (1) ganancia `|sin(π·pos/dur)|` vale 0 en pos=0 →
  silenciaría el primer beat; (2) las dos capas van desfasadas dur/2 → beats
  DISTINTOS a la vez (golpes fantasma).
- **Per-player listener-wrap (`status.currentTime >= musicalLoopSec` →
  `seekTo(0)`)** — FALLÓ en device: `status.currentTime` se actualiza tarde / poco
  frecuente, así que el wrap se dispara PASADO el fin musical → persiste el hueco
  de ~1 s (se oía "8 golpes, ~1 s de silencio, reinicia"). Además cada player
  envuelve por su cuenta → las capas se desincronizan irregularmente. El
  `updateInterval` bajo no alcanza para fixearlo.

## What works: single deterministic master clock

- **Why:** un solo timer alineado al reloj es independiente del jitter de
  `status.currentTime`, y como rebobina TODAS las capas BPM a la vez quedan
  bloqueadas en fase entre sí sin importar cuándo se sumaron.
- **How to apply:**
  - El archivo de audio = contenido musical EXACTO (`(60/bpm)*8` s) + cola de
    SILENCIO (~0.5 s buffer). Generador: `scripts/src/generate-bpm-sounds.mjs`
    (`atrim` + `apad`). NO necesita regenerarse para este enfoque.
  - Player: `loop = false`, `updateInterval` 200 ms. El listener
    `playbackStatusUpdate` queda SOLO para sincronizar el volumen master (NO hace
    wrap).
  - Refs clave en `MixerContext`: `bpmClockRef` (t0 = ms del primer compás),
    `bpmValueRef` (BPM activo; solo un BPM a la vez — sonidos de otro BPM se
    rechazan), `bpmPausePhaseRef` (fase guardada al pausar), `bpmTickRef`
    (handle del setTimeout), `bpmTickFnRef` (la fn del tick vive en un ref para
    que el setTimeout recursivo siempre llame a la última versión).
  - `startBpmScheduler`: `loopMs=(60/bpm)*8*1000`; calcula el próximo borde
    `t0 + n·loopMs` y agenda UN setTimeout. El tick hace `seekTo(0)` de todos los
    players con `bpm`, auto-sana con `play()` si `isPlayingRef`, y se reprograma.
  - El buffer de 0.5 s absorbe el jitter del timer: el player nunca toca el fin
    del archivo → nunca se dispara el corte nativo.
  - Ciclo de vida del clock (todos deben mantenerlo coherente o el loop se
    rompe): primer sonido BPM (`toggleSound` add-path) fija t0 + arranca el
    scheduler; sonido BPM adicional se alinea a la fase actual con un `seekTo`
    (NO cuantizar al beat — eso desfasaba el patrón); pausar/reanudar
    (`applyPlaying`) guarda/re-ancla la fase; quitar el último BPM
    (`toggleSound`/`removeSound`), `stopAll`, `loadPreset` y el cleanup de
    desmontaje frenan el scheduler y limpian los refs.

## Cuando lleguen los loops reales (de los productores)

Reemplazar los archivos en `assets/audio/mixer/bpm/` con los mismos nombres; el
fix es a nivel código (ya está) pero deben traer la misma cola de silencio
(~0.5 s) o regenerarse con esa convención. El estándar de audio de la app es AAC;
estos loops BPM son la excepción y van en WAV.
