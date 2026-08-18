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
