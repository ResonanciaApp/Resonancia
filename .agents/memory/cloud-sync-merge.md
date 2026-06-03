---
name: Cloud sync merge rules
description: How user activity (stats/favorites/progress) merges between device and cloud, and why deletions need the firstSync marker
---

# Sincronización de actividad (offline-first) — reglas de merge

Modelo híbrido: la actividad vive en AsyncStorage (anónimo = solo local). Con cuenta Clerk se sincroniza con el server una vez por sesión de la app (efecto en `PlayerContext`, gateado en `isSignedIn && localLoaded`).

## Regla central (favoritos y progreso)
- **Primer sync del dispositivo** (sin marca `@resonance_cloud_synced`): **unión** local ∪ server → recupera lo de la nube tras reinstalar o estrenar dispositivo, sin perder lo local.
- **Sync siguientes**: lo **local es autoritativo** y reemplaza el set del server.

**Why:** con unión siempre, un "desfavorito" reaparece — incluso en UN solo dispositivo tras reiniciar — porque al volver a abrir se vuelve a unir con el server que todavía lo tenía. El `PUT /me/favorites` hace delete+insert (reemplaza el set entero), así que empujar lo local autoritativo hace que los borrados persistan.

**How to apply:** al tocar este sync, no cambiar a "unión siempre". Si hace falta convergencia de borrados entre VARIOS dispositivos en paralelo, hay que agregar tombstones o LWW por ítem (`session_progress.updatedAt` ya existe; favoritos no tiene timestamp expuesto). Limitación actual documentada en replit.md.

## Eventos de reproducción (estadísticas)
Siempre **unión** — es un log append-only. El server deduplica por índice único `(user_id, client_event_id)` + `onConflictDoNothing`. `clientEventId` se deriva como `${sessionId}__${playedAt}`. NO hay tabla `user_stats`: las stats se derivan de `playback_history`.

## Marca y logout
`@resonance_cloud_synced` se setea tras el primer sync OK. En logout se borra (y se resetea `syncedRef`) para que el próximo login haga unión de recuperación y no un reemplazo autoritativo con datos del usuario anterior (misma máquina, otra cuenta).

## Limitación in-flight (aceptada Phase 1)
El sync aplica el merge sobre un snapshot tomado al arrancar; si el usuario togglea un favorito en esa ventana corta, el `setFavorites(merged)` podría pisarlo. Ventana = arranque de la app, riesgo bajo.
