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
