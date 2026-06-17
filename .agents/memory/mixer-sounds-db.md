---
name: Mixer sounds DB system
description: Cómo funciona el sistema de sonidos del mixer (Mi Música) gestionado desde DB + API + admin + mobile.
---

## Arquitectura

- **DB**: tabla `mixer_sounds` en `lib/db/src/schema/mixer-sounds.ts` — `id` es text PK (slug), no autoincrement.
- **API pública**: `GET /api/sounds` en `routes/sounds.ts` — devuelve solo `isActive: true`.
- **API admin**: CRUD en `routes/admin.ts` bajo `/admin/sounds` + `/admin/sounds/:id`.
- **Admin UI**: `artifacts/resonancia-admin/src/pages/sonidos.tsx` — igual que sesiones (presigned upload).
- **Mobile**: `context/SoundsContext.tsx` fetch al init → popula `REMOTE_SOUND_MAP` en `lib/remoteSoundMap.ts`.
- **MixerContext**: `createPlayerFor` usa `SOUND_MAP[id]` (bundleado) con fallback `REMOTE_SOUND_MAP[id]` (remoto `{ uri: url }`).

## Patrones clave

- URL resolution: mismo helper que `lib/avatar.ts` — `/objects/…` → `/api/storage/objects/…` con `EXPO_PUBLIC_API_URL` base.
- Sonidos locales en `data/sounds.ts` siguen funcionando como fallback; `SoundsContext` los fusiona con los de DB.
- `isPremium` de sonidos locales se puede sobreescribir desde la DB.
- Sonidos nuevos (solo en DB, sin bundle) se agregan al final de la lista fusionada.

**Why:** El mixer necesitaba gestión dinámica de sonidos sin resubir la app; la DB + API permite que el admin agregue/desactive sonidos en producción.

## Bugs de activación encontrados y corregidos

Dos bugs apilados impedían activar sonidos DB-only:

### 1. `SoundsContext` fetch con URL relativa
- `fetch("/api/sounds")` falla silenciosamente en Expo Go iOS/Android (no hay base URL en nativo).
- Fix: usar `EXPO_PUBLIC_API_URL` como prefijo → `fetch(\`${apiBase}/api/sounds\`)`.
- Consecuencia del bug: `REMOTE_SOUND_MAP` quedaba vacío → `available=false` → cards disabled.

### 2. Guard incorrecto en `handleSoundPress` (musica.tsx)
- `if (!hasSoundFile(sound.id)) return;` bloqueaba TODOS los sonidos sin archivo bundleado.
- Fix: `if (!hasSoundFile(sound.id) && !REMOTE_SOUND_MAP[sound.id]) return;`
- Este guard debe permitir sonidos con URL remota aunque no tengan bundle local.

### 3. Metro no descubre módulos nuevos en hot-reload
- `remoteSoundMap.ts` fue creado en sesión; Metro no lo incluyó en hot-reloads → `ReferenceError: Property 'REMOTE_SOUND_MAP' doesn't exist`.
- Fix: restart completo del workflow expo (RA) fuerza re-bundle de 2500+ módulos.
- Regla: archivos `lib/` nuevos siempre requieren RA, no solo hot-reload.
