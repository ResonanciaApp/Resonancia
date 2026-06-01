---
name: Artistas (perfiles curados)
description: Modelo y convenciones de la función Artistas en el mobile (perfiles curados, atribución de pistas)
---

# Artistas

Perfiles **curados en código** (no usuarios reales) de productores certificados. Viven en `data/artists.ts`.

## Convenciones de atribución

- `artistId` en `Session` aplica **solo a Música Ambient / Música Enteógena**. Otras categorías no llevan artista.
- Una sesión Ambient/Enteógena **sin** `artistId` pertenece al artista de la casa `DEFAULT_ARTIST_ID = "resonancia"`.
- `getArtistSessions(id)` debe filtrar por categoría/soundTag (Ambient/Enteógena) **antes** de aplicar el fallback a Resonancia. Si no, el perfil de Resonancia se traga todo el catálogo sin artistId.

## Dos resolvers (no confundir)

- `getArtist(id?)` → **con** fallback a Resonancia. Para créditos/player (siempre hay algo que mostrar).
- `getArtistById(id?)` → **sin** fallback (devuelve `undefined`). Para la pantalla de perfil `app/artista/[id].tsx`, que muestra "Artista no encontrado" si el id es inválido.

**Why:** un fallback silencioso en el perfil hacía que `/artista/<id-invalido>` mostrara "Resonancia" y ocultara errores de navegación.

## Anti-ciclo de imports

`artists.ts` importa `SESSIONS` de `sessions.ts`. `sessions.ts` **NO** debe importar `artists.ts` (solo guarda `artistId?: string`). Mantener esa dirección.
