---
name: BPM gapless rhythmic loop (mixer)
description: How rhythmic drum loops in the Mezclador loop gaplessly and on-tempo, and why native loop + crossfade both fail for rhythm
---

# BPM gapless rhythmic loop

The Mezclador's rhythmic drum sounds (MixSound with `bpm`) must loop GAPLESS and
on-tempo. Two "obvious" approaches both fail for rhythm; the working one is a
pre-emptive in-flight seek.

## What does NOT work (and why)

- **Native loop (`player.loop = true`)** — expo-audio reinicia el loop esperando
  `AVPlayerItemDidPlayToEndTime` y recién ahí hace `seek(0)` + `play()`
  (confirmado en expo-audio `AudioPlayer.swift`). Eso SIEMPRE deja un hueco
  audible en el empalme. Sirve para texturas ambient continuas (el crossfade lo
  enmascara), pero para ritmo el hueco arruina el groove. Cambiar el formato
  (MP3→WAV) solo achica el hueco, no lo elimina.
- **El crossfade de dos capas (a/b) del mixer** — está pensado para texturas
  continuas, NO para ritmo: (1) su ganancia `|sin(π·pos/dur)|` vale 0 en pos=0,
  o sea silenciaría el primer beat de cada vuelta; (2) las dos capas van
  desfasadas dur/2 → sonarían beats DISTINTOS a la vez (golpes fantasma).

## What works: pre-emptive seek loop (single player)

- **Why:** mantiene la arquitectura de un solo player (owner de pantalla
  bloqueada = `pair.a`, sync de volumen master en el mismo listener, park/resume
  y pause/play sin tocar). Sin watchdog aparte.
- **How to apply:**
  - El archivo de audio = contenido musical EXACTO (`(60/bpm)*8` s) + cola de
    SILENCIO (~0.5 s buffer). El generador (`scripts/src/generate-bpm-sounds.mjs`)
    hace `atrim=end_sample=totalSamples` + `apad=whole_len=totalSamples+BUFFER`.
  - Player: `loop = false`, `updateInterval` bajo (~60 ms).
  - En el listener `playbackStatusUpdate`: cuando `status.currentTime >=
    musicalLoopSec` (calculado del BPM, NO de la duración del archivo) →
    `seekTo(0)` async, sin pausar → vuelve a 0 durante la cola silenciosa = loop
    gapless y a tempo. Guard `wrapping` evita re-emitir el seek en vuelo.
  - El buffer existe para que, si el seek llega unos ms tarde, el player NO
    toque el fin del archivo (que dispararía el corte nativo). El umbral de wrap
    = duración MUSICAL, así el silencio del buffer nunca se escucha.
  - `currentTime` es lectura nativa EN VIVO (`ref.currentItem?.currentTime()`),
    por eso el listener detecta el cruce a tiempo.

## Cuando lleguen los loops reales (de los productores)

Reemplazar los archivos en `assets/audio/mixer/bpm/` con los mismos nombres,
PERO necesitan el MISMO fix a nivel código (ya está) y deben traer la misma cola
de silencio (~0.5 s) o regenerarse con esa convención. El estándar de audio de
la app es AAC, pero estos loops BPM son la excepción y van en WAV.
