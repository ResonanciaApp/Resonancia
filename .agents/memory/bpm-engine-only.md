---
name: BPM engine-only (sin fallback expo)
description: bpmAudioEngine es la única ruta para sonidos BPM; toda la maquinaria de fallback JS fue eliminada de MixerContext
---

## La decisión
Desde ago 2026, `bpmAudioEngine` (react-native-audio-api) es la **única** ruta para sonidos BPM en el Mezclador. El fallback expo-audio basado en `setInterval` + reloj de pared fue eliminado.

**Why:** El fallback causaba drift de fase en sesiones largas (timer JS no es sample-accurate). La ruta del motor nativo ya existía y era correcta; el fallback compensaba un race de arranque en frío que era innecesario.

## Lo que se eliminó
- `bpmSystemRef` (`"engine" | "expo" | null`) — ya no hay dos caminos
- `bpmClockRef`, `bpmPausePhaseRef` — el contexto nativo conserva la fase en suspend/resume
- `bpmTickRef`, `bpmTickFnRef` — el tick JS no se necesita con `AudioBufferSourceNode` loop nativo
- `startBpmScheduler()`, `stopBpmScheduler()` — funciones borradas

## Cómo funciona ahora
- `toggleSound` y `loadPreset` siempre llaman `bpmAudioEngine.play()`.
- Si el engine no está listo al primer tap (arranque muy rápido), lo esperan con `await bpmAudioEngine.init()` dentro de un `void (async () => {...})()` — el estado React se actualiza sincrónicamente, el play llega ~ms después.
- `init()` en `bpmAudioEngine.ts` usa `_initPromise` para deduplicar llamadas concurrentes.
- Pause/resume usa `bpmAudioEngine.suspend()/resume()` en `applyPlaying`.

## Si el módulo nativo no existe (Expo Go / build viejo)
`bpmAudioEngine.isReady()` queda en false y `play()` es no-op. Los sonidos BPM simplemente no suenan — comportamiento aceptado; en producción el módulo siempre está presente.

## How to apply
- No crear `bpmSystemRef` ni lógica de fallback en futuros cambios al Mezclador.
- Cambios de volumen de sonidos BPM: `bpmAudioEngine.setVolume()` directamente (sin `bpmSystemRef` gate).
- Cleanup de sonidos BPM: `bpmAudioEngine.stop(id)` directamente.
