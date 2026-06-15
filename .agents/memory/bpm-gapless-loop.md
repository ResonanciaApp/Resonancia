---
name: BPM gapless loop engine
description: Por qué los loops rítmicos BPM del Mezclador usan react-native-audio-api (no expo-audio) y las reglas que NO se deben romper. Incluye historial de enfoques en expo-audio que no alcanzaron.
---

# Loops BPM gapless en el Mezclador

Solo los sonidos de categoría `"bpm"` (MixSound con `bpm`) usan un motor de Web Audio
nativo (`react-native-audio-api`) en `lib/bpmAudioEngine.ts`. Todo lo demás del
Mezclador sigue en expo-audio. Objetivo: tambores a tempo que loopean SIN hueco,
on-tempo y bloqueados en fase entre capas.

**Por qué (decisión):** gapless + on-tempo + phase-lock exige `AudioBufferSourceNode.loop`
con `loopEnd` exacto y un reloj de transporte común a nivel de muestra; eso solo lo da
Web Audio nativo. expo-audio no llega (ver historial abajo).

## Reglas que NO romper

- **expo-audio es el ÚNICO dueño de la AVAudioSession.** El motor llama
  `AudioManager.disableSessionManagement()` antes de crear el `AudioContext`. Si esta
  lib gestiona la sesión, pelea con expo-audio y el audio del resto de la app rompe.
- **`loopEnd` = largo musical, NUNCA el largo del archivo.** Los WAV BPM traen ~0.5s
  de silencio al final (`scripts/src/generate-bpm-sounds.mjs`, `atrim`+`apad`). `loopEnd`
  debe ser `(60/bpm)*4*loopBars` para empalmar sin hueco. No "arreglar" recortando el
  WAV ni tocar el generador.
- **Reloj/fase compartidos:** la familia BPM entera se ancla a un solo sistema (todas
  las capas comparten `transportStart`). Entrada en fase con
  `offset=(currentTime-transportStart)%loopSec`; pausa/reanuda con
  `ctx.suspend()/resume()` (congela el reloj → conserva la fase). En MixerContext eso
  es `bpmSystemRef`: se fija con el PRIMER sonido BPM según `isReady()` y se mantiene
  hasta quitar todos los BPM. No mezclar capas BPM entre motor y expo o pierden fase.
  Sumar una capa nueva = alinear a la fase actual (NO cuantizar al beat — eso desfasa
  el patrón).
- **play() es async (espera el decode) → SIEMPRE cancelable.** Si el sonido se quita /
  `stopAll` / `loadPreset` / re-tap mientras decodifica, al volver del `await` hay que
  abortar ANTES de crear el source, o queda audio huérfano sonando. Patrón: token por
  id (`wanted` map + `playSeq`); `stop/stopAll/dispose` limpian el token. No volver a
  un `play()` que cree el source sin revalidar el token.

## Gating y build

- `init()` hace dynamic import + try/catch. Sin módulo nativo (build de dev viejo,
  Expo Go, **web**) → `isReady()=false` y MixerContext cae al camino expo de siempre.
  No crashea. **Pero el motor solo funciona tras reconstruir el dev client** (módulo
  nativo). Restricción del skill expo: NUNCA correr/sugerir EAS CLI ni `npx expo`;
  el plugin va en `app.json` estático (`"react-native-audio-api"`).

## Regresión aceptada (documentada)

Una mezcla SOLO-BPM corre en el motor y NO tiene un player expo → no hay dueño del
Now Playing del lock screen, y el enforcement del sleep-timer en background se degrada
(el de foreground —setInterval + recheck por AppState— sigue OK). Mezclas con
cualquier sonido no-BPM mantienen lock screen porque ese sonido vive en expo-audio.

## Historial: enfoques en expo-audio que NO alcanzaron (por qué migramos)

**Por qué importa:** explica por qué NO volver a intentar resolver esto en expo-audio.

- **Native loop (`player.loop = true`)** — expo-audio espera
  `AVPlayerItemDidPlayToEndTime` y recién ahí hace `seek(0)`+`play()` → SIEMPRE hueco
  audible. Sirve para texturas ambient (el crossfade lo enmascara), no para ritmo.
- **Crossfade a/b del mixer** — para texturas continuas, no ritmo: ganancia
  `|sin(π·pos/dur)|` vale 0 en pos=0 (mata el primer beat) y las dos capas van
  desfasadas dur/2 (golpes fantasma).
- **Per-player listener-wrap** (`currentTime>=loopSec` → `seekTo(0)`) — `currentTime`
  se actualiza tarde/poco → el wrap dispara pasado el fin → hueco ~1s; y cada player
  envuelve por su cuenta → se desincronizan.
- **Reloj maestro único (setTimeout alineado + `seekTo(0)` de todas las capas a la vez)**
  — fue el mejor intento en expo-audio (independiente del jitter de `currentTime`,
  rebobina todo junto → phase-lock). Aun así el `seekTo` de expo-audio no es
  sample-accurate, así que persistía micro-hueco/drift. Eso motivó la migración al
  motor nativo. Si alguna vez hace falta un fallback sin módulo nativo, este es el
  patrón a recrear (NO el native-loop ni el listener-wrap).
