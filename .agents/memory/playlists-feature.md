---
name: Playlists de Resonancia — admin + mobile
description: Playlists curatoriales del home. Tabla DB catalog_playlists; admin CRUD en /admin/playlists; mobile applyPlaylistsSnapshot. Patrón igual que categorías/sesiones.
---

# Playlists de Resonancia

## Tabla DB
`catalog_playlists`: slug (unique), title, description, coverUrl, durationLabel,
savedCount, sessionIds (text[]), playlistType ("sessions"|"music"), sortOrder, isActive.

## Patrón de hydration mobile
`applyPlaylistsSnapshot` en `data/playlists.ts` (mismo patrón que `applyCatalogSnapshot`):
- Actualiza entradas existentes en PLAYLISTS por slug
- Inserta nuevas con `FALLBACK_COVER = require("../assets/images/sessions/session-2.png")`
- `coverUrl` tiene prioridad sobre cover bundleado si el servidor la envía
- CatalogContext.tsx llama `applyPlaylistsSnapshot(data.playlists)` si playlists presente

## Admin page
`resonancia-admin/src/pages/playlists.tsx`:
- Hooks: useListAdminPlaylists, useCreate/Update/DeleteAdminPlaylist
- Session picker usa useGetCatalog(); filtra por playlistType ("music" = isMusicCategory)
- Cover upload: `{ name, contentType, size }` → `uploadURL` (no `uploadUrl`!) + objectPath
  → serving URL = `/api/storage/objects/${objectPath}`

## Why
- CatalogResponse incluye `playlists?` (opcional) para backward compat con versiones
  bundleadas antiguas que no lo tenían
- Entradas bundleadas no se eliminan al hidtar (evita romper refs en código legacy)
