---
name: BPM gapless loop engine
description: Los loops BPM del Mezclador usan expo-audio con reloj maestro (reloj nativo react-native-audio-api fue revertido por el usuario). Historial de enfoques fallidos e instrucciones para evitar regresiones.
---

# Loops BPM en el Mezclador — estado actual: expo-audio con reloj maestro

Solo los sonidos de categoría `"bpm"` (MixSound con `bpm`) usan un camino especial en
MixerContext (ver `createPlayerFor` + `startBpmScheduler`). Todo lo demás del Mezclador
sigue el crossfade a/b normal de expo-audio.

## Estado actual: reloj maestro expo-audio (NO motor nativo)

El motor nativo (`react-native-audio-api` / `lib/bpmAudioEngine.ts`) fue implementado
y luego **revertido explícitamente por el usuario** (`"restablecer a modo de fábrica"`).
El archivo `lib/bpmAudioEngine.ts` fue eliminado y la dependencia removida de `package.json`
y `app.json`. **No reinstalar ni reintroducir** sin pedido explícito del usuario.

El camino expo-audio con reloj maestro es el que queda:

- `player.loop = false` — el loop nativo de expo-audio tiene siempre hueco en el empalme.
- Un ÚNICO reloj maestro (`bpmClockRef`, `bpmTickRef`, `startBpmScheduler`) hace `seekTo(0)`
  de TODOS los players BPM a la vez justo en cada borde de compás.
- El archivo WAV trae ~0.5s de silencio extra al final que absorbe el jitter del timer.
- Pausar: guardar fase en `bpmPausePhaseRef` y frenar el scheduler.
- Reanudar: re-anclar `bpmClockRef = Date.now() - phase` y `seekTo(phase/1000)` en cada
  player BPM, luego re-iniciar el scheduler.
- Entrar con un segundo sonido BPM mientras la mezcla suena: `seekTo` a la fase actual
  (`(Date.now() - bpmClockRef) % loopMs / 1000`) — NO cuantizar al beat (eso desfasaría
  el patrón).
- Salir todos los BPM: liberar `bpmClockRef/bpmValueRef/bpmPausePhaseRef + setActiveBpm(null)`.

**Limitación conocida y aceptada:** `seekTo` de expo-audio no es sample-accurate → puede
haber micro-hueco/drift residual. Es mejor que el native-loop (hueco fijo cada vuelta) y
que el listener-wrap (hueco de ~1s). Si alguna vez se necesita verdadero gapless on-tempo,
el motor nativo es la ruta — pero requiere permiso explícito del usuario antes de tocar nada.

## Historial: por qué los enfoques anteriores en expo-audio no alcanzaron

Esto explica por qué el reloj maestro es la mejor opción disponible en expo-audio:

- **Native loop (`player.loop = true`)** — expo-audio espera `AVPlayerItemDidPlayToEndTime`
  y recién ahí hace `seek(0)+play()` → SIEMPRE hueco audible. Sirve para texturas ambient
  (el crossfade a/b lo enmascara), no para ritmo.
- **Crossfade a/b del mixer** — para texturas continuas, no ritmo: ganancia
  `|sin(π·pos/dur)|` vale 0 en pos=0 (mata el primer beat) y las dos capas van desfasadas
  dur/2 (golpes fantasma).
- **Per-player listener-wrap** — `currentTime` llega tarde; cada player envuelve por su
  cuenta → desincronizan.
- **Reloj maestro único (actual)** — el mejor compromiso en expo-audio; `seekTo` sigue sin
  ser sample-accurate pero es determinista y todas las capas se rebobinan juntas.
- **Motor nativo (react-native-audio-api)** — gapless verdadero, pero revertido por el
  usuario. Si se retoma: `lib/bpmAudioEngine.ts` debe recrearse, agregar la dependencia a
  `package.json` y el plugin a `app.json`, y reconstruir el dev client.

## Reglas que no romper con el enfoque actual

- **`bpmClockRef` es la fuente de verdad de la fase.** Nunca modificarlo sin detener
  primero el scheduler, o el próximo tick cuantiza a la hora equivocada.
- **BPM distintos no se pueden mezclar** — el `toggleSound` ya rechaza (return false) si
  `soundBpm !== bpmValueRef.current`.
- Los WAV de BPM en `assets/audio/mixer/bpm/` tienen duración exacta de 2 compases + 0.5s
  de silencio; no reemplazarlos sin respetar esa estructura.
