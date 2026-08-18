---
name: Sleep timer background enforcement
description: Patrón para que el timer de sueño se cumpla con la pantalla bloqueada, tanto en MixerContext como en PlayerContext
---

## El problema
`setInterval` se throttlea/congela cuando la pantalla está bloqueada en iOS. El timer de sueño que solo usa `setInterval` no dispara la pausa.

## La solución (aplicada a ambos contextos)
Tres capas de enforcement:

1. **`sleepEndTimeRef`** — timestamp absoluto (ms) de cuando expira el timer. Se fija en `setSleepTimer`. Todos los checks usan `Date.now() >= endTs`, no conteos.

2. **Guardián en el listener nativo de audio** (`playbackStatusUpdate` / `handleMainStatus`) — este callback SÍ corre en background porque el proceso de audio sigue activo por `UIBackgroundModes: ["audio"]`. Al detectar expiración, para el audio inmediatamente.

3. **AppState recovery** — al volver al frente (`nextState === "active"`), se recalcula el restante real y, si expiró, se dispara la pausa. Compensa ticks perdidos en background.

## Diferencia entre MixerContext y PlayerContext

**MixerContext** (mixer ambiental):
- Guardián llama `applyPlayingRef.current(false)` directamente.
- AppState también llama `applyPlayingRef.current(false)`.

**PlayerContext** (reproductor de sesiones):
- Guardián pone `setSleepTimerRemaining(0)` → dispara el `useEffect` de expiración existente (que hace flush de stats + teardownPlayback). Esto evita llamar funciones de teardown con posible closure stale desde el handler.
- AppState también pone `setSleepTimerRemaining(0)` si expiró.

## El setInterval (UI)
Sigue existiendo pero solo actualiza el display (segundos en pantalla). Calcula `Math.ceil((endTs - Date.now()) / 1000)` en cada tick — no decrementa ciegamente — así si se salta ticks, el display se auto-corrige.

**Why:** El setInterval nunca fue el enforcement real; en background no es fiable. El enforcement real son el listener nativo y el AppState recovery.

## How to apply
- Cualquier nuevo timer de duración en audio: usar `endTimeRef` timestamp + chequear en el listener nativo + AppState recovery.
- NO confiar en que `setInterval` dispare la acción crítica; usarlo solo para el display.
