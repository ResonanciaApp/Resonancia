---
name: library-sync
description: Sync de carpetas/playlists/favoritos del usuario a la nube — patrón snapshot JSONB
---

# Library Sync (Tarea #175)

## Regla
`GET /me/library` + `PUT /me/library` — snapshot completo como JSONB en la tabla `user_library` (una fila por userId=PK). No se usa CRUD por ítem; el cliente siempre reemplaza el snapshot entero.

**Why:** Los datos del contexto ya son JSON-serializables (vienen de AsyncStorage). JSONB evita migraciones relacionales complejas al evolucionar los tipos `Folder`/`Playlist`/`FavFolder`. Consistente con el patrón de `favorites` en cloudSync.

## Merge rules (mismo modelo que cloudSync.ts)
- **firstSync** (marca `@resonance_library_first_sync` ausente): unión local∪server por `id`. Recupera datos de la nube tras reinstalar.
- **Syncs siguientes**: local es autoritativo. El server recibe un push debounced (1.5s) en cada cambio de datos.

**How to apply:** `hydrating.current = true` bloquea el push durante la carga inicial. El `useEffect` de push depende de `[folders, playlists, favFolders, pinnedFavoriteIds, isSignedIn]`. Al cerrar sesión `isSignedIn=false` corta los pushes automáticamente.

## Archivos
- `lib/db/src/schema/user-library.ts` — tabla `user_library` (userId PK, 4 columnas jsonb)
- `lib/db/src/schema/index.ts` — export añadido
- `artifacts/api-server/src/routes/users.ts` — GET + PUT /me/library al final del router
- `lib/api-spec/openapi.yaml` — path `/me/library` + schema `LibrarySnapshot`
- `lib/api-client-react/src/generated/` — funciones `getMyLibrary`/`setMyLibrary` generadas
- `artifacts/mobile/context/FoldersPlaylistsContext.tsx` — sync integrado (load+firstSync+debounced push)

## Caveat
`coverUri` de playlists (foto del celular) no se restaura entre dispositivos: la URI es local. Solo los metadatos (nombre, orden, sessionIds, tipo de portada) viajan al server.
