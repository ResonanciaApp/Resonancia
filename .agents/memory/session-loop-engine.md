---
name: Session loops via gapless engine
description: LOOP_SESSIONS del reproductor suenan por bpmAudioEngine; main expo-audio es ancla MUDA de lock-screen
---

Las sesiones en loop (LOOP_SESSIONS) ya NO usan el crossfade JS de dos capas (layerB + interval 100ms — eliminado, hallazgo de auditoría). El audio audible sale de `bpmAudioEngine.playLoopAsset("session:<id>", assetRequireId, vol)` (AudioBufferSourceNode, loopEnd=buffer.duration → gapless).

**Reglas:**
- El main player de expo-audio queda en loop nativo con `volume = 0`: es el ancla de Now Playing/lock-screen, del sleep timer en background y del mirror play/pause del sistema. NUNCA des-mutearlo mientras `loopCrossfadeRef` esté activo, salvo `loopFallbackRef` (motor no disponible → loop nativo audible, costura perceptible; sin crossfade JS de vuelta).
- `setMainVolume` enruta al motor (`setVolume`) cuando hay loop de sesión; el guard cubre la ventana de init/decode (voz aún null) para no des-mutear el ancla.
- Pausa/reanudar = `stop(key)` + re-`playLoopAsset` (un BufferSource no se pausa; reinicia desde 0 — OK para texturas). NO usar suspend/resume del ctx (compartido con el Mezclador).
- Voces `external` del motor van directo a `ctx.destination` (no al masterGain del Mezclador) y `stopAll()` del Mezclador las salta (también los play() en vuelo con clave `session:`). Exclusividad sesión↔mezcla la garantiza audioBridge.
- `init()` del motor solo bajo demanda tras setAudioModeAsync (el prewarm de MixerContext tras ensureAudioMode es deliberado — fix del primer tap en silencio; no quitarlo).
- El catch de carga de loop debe hacer `teardownLayers()` (apaga voz del motor pendiente/sonando) antes de caer a simulación.

**Why:** un ctx compartido entre reproductor y Mezclador contamina volumen master/stopAll; y el ancla muda es lo único que mantiene lock-screen + sleep timer sin que expo-audio pierda la AVAudioSession.

## Loop infinito + parpadeo del ancla (ago 18)
- LOOP_SESSIONS ahora son INFINITAS: playSession delega a playSessionWithDuration(session, Infinity) vía playSessionWithDurationRef (no hay callers externos de WithDuration — era código muerto). infinite → sin auto-apagado, progress 0, elapsed cuenta, `infiniteLoop` expuesto en el context; UI muestra "∞", seek/±15 deshabilitados y seekTo hace no-op (infiniteLoopRef).
- El ancla muda (main.loop=true con asset corto) emite un micro playing=false en cada vuelta del loop nativo → el mirror lo tomaba como pausa del usuario (apagaba el motor = hueco + botón parpadeando). Fix: debounce 700ms (loopPauseDebounceRef + anchorPlayingRef) — solo es pausa real si persiste; limpiar en teardownLoopCrossfade.

## Cola implícita estilo Calm (ago 18)
- Toda sesión NO-meditación reproducida vía playSession arma una cola implícita con su categoría (queueImplicit=true): prev/next en el reproductor, SIN shuffle ni auto-avance al terminar. Playlists explícitas (playSessionInPlaylist) siguen igual. La cola implícita se RECONSTRUYE desde getSessionsByCategory en cada advancePlaylist (la hidratación del catálogo muta SESSIONS in-place). stop() limpia toda la cola.
