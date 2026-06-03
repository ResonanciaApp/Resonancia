---
name: Cloud sync of user activity (offline-first)
description: Reglas durables del sync de actividad (stats/historial/favoritos/progreso) con cuenta Clerk; firstSync, recovery gating y campos intencionalmente null.
---

# Sync de actividad del usuario a la nube (offline-first)

La app guarda actividad en AsyncStorage y la sincroniza con el server solo si hay
cuenta Clerk. Infra: `lib/cloudSync.ts` (merge), efecto de sync en
`PlayerContext.tsx`, rutas `api-server/src/routes/activity.ts`, tablas Drizzle
`playback_history`/`favorites`/`session_progress`.

## Reglas / decisiones durables

- **Historial NO se sincroniza como entidad propia**: es derivable de los eventos
  de reproducción (`statEvents`) que ya vuelven de la nube. Se reconstruye SOLO en
  la primera sync exitosa del dispositivo (recuperar tras reinstalar). Después, lo
  local es autoritativo.
  **Why:** evita una tabla redundante; el historial = "última vez por sesión".
  **How:** quedarse con el `playedAt` más reciente por `sessionId` uniendo
  cloud-events + estado previo.

- **`recovered` gating del firstSync**: `syncActivity` devuelve `SyncResult.recovered`
  = `!firstSync || (plays && favs && progress reads OK)`. El llamador solo debe
  persistir la marca `@resonance_cloud_synced` si `recovered`.
  **Why:** si se marca firstSync como hecho tras un arranque offline (lecturas
  fallidas), el siguiente arranque entra en modo autoritativo-local y un local
  vacío (recién reinstalado) sobrescribe favoritos/progreso de la nube → pérdida
  de datos. Sin la marca, el próximo arranque reintenta firstSync.

- **Reconstrucción de estado tras sync = update funcional**: usar
  `setHistory(prev => ...)` (no el valor del closure), porque el efecto de sync es
  async y el usuario puede reproducir algo mientras está en vuelo; un `setX(valor)`
  basado en closure viejo pisaría esos cambios. Aplica a cualquier estado que se
  fusione tras el await.

- **`completed`**: flag opcional en `StatEvent`/`SyncStatEvent` (backward-compat con
  eventos viejos sin el campo). Se marca true en `status.didJustFinish` y cuando el
  sleep-timer llega a 0; se consume/resetea SIEMPRE en `recordStat` (incluso si el
  play fue muy corto y no se registra) para que no se filtre a la sesión siguiente.

- **`contentType`/`source` quedan `null` a propósito** en el push de plays:
  `categoryId` (tipo) + `categoryLabel` (sección) ya cubren el spec; no duplicar.
