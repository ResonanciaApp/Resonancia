---
name: Generación de reproducción (PlayerContext)
description: Modelo de token de generación para el cambio de sesión determinista en el reproductor
---

# playGenRef — token de generación + makeSessionListener

## Guard primario: closure en makeSessionListener

Desde agosto 2026 el guard principal contra eventos nativos stale es
`makeSessionListener(gen)`: devuelve un handler con `gen` capturada en closure.
Se re-registra (remove + addListener) antes de cada `main.replace()` en los tres
paths de reproducción (playSession con audio, playSessionWithDuration loop gapless,
playSessionWithDuration duración fija).

Primera línea del closure: `if (gen !== playGenRef.current) return;`

El listener anterior (gen vieja) queda automáticamente obsoleto. Sus eventos tardíos
van al nuevo listener pero son descartados porque su gen capturada ya no es la vigente.

## Guard secundario: playGenRef en callbacks async

Regla: TODO callback asíncrono (await, init del motor gapless, intervals, auto-avance)
captura `gen` al nacer y verifica contra `playGenRef.current` antes de tocar estado.
`playSession`, `playSessionWithDuration` y `stop()` incrementan la generación.

**Why:** con guards booleanos (`switchingRef` suelto), un `playSession` superseded
que despertaba de `setAudioModeAsync` reemplazaba el main player con el track VIEJO,
o su `catch` liberaba el guard de la sesión nueva.

## mainPlayerGenRef — belt-and-suspenders

Se sigue estampando con `gen` antes de cada `replace()` (secundario a la closure).
El guard dual del listener (primero closure, luego el handler interno) asegura que
incluso sin el closure, mainPlayerGenRef aún filtras el caso edge.

**How to apply:**
- Nuevos caminos asíncronos en PlayerContext: capturar `gen` al inicio y verificar tras cada await.
- `switchingRef` filtra side-effects de UI (isPlaying, lock-screen) durante transición.
- Loading: paths sin main (voz-sola, sim) limpian `setIsLoading(false)` explícito — el finally de una carga superseded no lo hace (gateado por gen).
- `startSimulation(session, gen)`: el interval se auto-destruye si la generación cambió.
- `loopFallbackRef` sigue vivo (asset remoto → loop nativo audible); no eliminarlo.
