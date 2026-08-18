---
name: Generación de reproducción (PlayerContext)
description: Modelo de token de generación para el cambio de sesión determinista en el reproductor
---

# playGenRef — token de generación

Regla: TODO callback asíncrono ligado a una reproducción (continuación tras `await`, init del motor gapless, intervals de simulación, auto-avance diferido, catch/finally) debe capturar `gen` al nacer y verificarlo contra `playGenRef.current` antes de tocar estado. `playSession`, `playSessionWithDuration` y `stop()` incrementan la generación.

**Why:** con guards booleanos (`switchingRef` suelto), un `playSession` superseded que despertaba de `setAudioModeAsync` reemplazaba el main player con el track VIEJO, o su `catch` liberaba el guard de la sesión nueva. El chequeo por session-id no cubría re-play de la misma sesión.

**How to apply:**
- Nuevos caminos asíncronos en PlayerContext: capturar `const gen = playGenRef.current` (o `++` si inician reproducción) y verificar tras cada await.
- `switchingRef` sigue existiendo SOLO para filtrar eventos del status listener nativo (primer tick post-replace, que no puede capturar generación). El listener además gatea `setIsLoading(false)` y la activación del lock-screen pendiente en `!switchingRef.current` (un status encolado del track viejo traía duración válida y activaba metadata nueva con datos viejos).
- Loading: los paths que NO cargan main (voz-sola, simulación) limpian `setIsLoading(false)` explícito — el finally de una carga superseded no lo limpia (gateado por gen) y quedaría pegado.
- `startSimulation(session, gen)`: el interval se auto-destruye si la generación cambió.
- `loopFallbackRef` sigue vivo (motor no disponible → loop nativo audible); no eliminarlo.
