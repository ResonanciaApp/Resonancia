---
name: Resonadores DB
description: Tabla resonadores en BD Drizzle, hook mobile, rutas API y panel admin. Qué decisiones hay que mantener.
---

## Estructura

- **Schema**: `lib/db/src/schema/resonadores.ts` — tabla `resonadores`, PK slug de texto (ej. `"luna-cosmica"`), `jsonb` para `projects`/`formacion`.
- **Seed**: `lib/db/seed-resonadores.ts` — 9 resonadores iniciales; corre con `./artifacts/api-server/node_modules/.bin/tsx lib/db/seed-resonadores.ts`.
- **API**: `artifacts/api-server/src/routes/resonadores.ts` — `GET /resonadores` (público), `GET /resonadores/:id`, `GET|POST|PATCH|DELETE /admin/resonadores`, `POST /admin/resonadores/seed`.
- **Admin panel**: `artifacts/resonancia-admin/src/pages/resonadores.tsx` — CRUD + toggle status + botón "Seed inicial".
- **Hook mobile**: `artifacts/mobile/hooks/useResonadores.ts` — `useResonadores()` y `useResonadorById()` con fallback a `RESONADORES` estático.

## Decisiones clave

- **Fotos siempre bundleadas**: `photoUrl` y `coverPhotoUrl` son `null` en BD; el hook busca el ID en `STATIC_MAP` y usa el asset local. Solo si un resonador nuevo NO tiene asset bundleado se construye `{ uri: photoUrl }`. No cambiar esta lógica sin subir fotos al object storage primero.
- **Fallback estático**: si la API falla o devuelve vacío, la app usa `data/resonadores.ts` — nunca pantalla en blanco.
- **Status**: `"published"` | `"draft"`. Solo `published` aparece en el endpoint público. El admin puede togglear con el switch.
- **sortOrder**: entero para ordenamiento; por defecto el endpoint ordena `sortOrder ASC, name ASC`.

**Why:** Los datos de resonadores eran hardcodeados (10 entradas en `data/resonadores.ts`). La BD permite que el admin edite perfiles sin un nuevo build. El fallback garantiza continuidad mientras la API no esté disponible.

**How to apply:** Siempre usar `useResonadores` / `useResonadorById` en pantallas mobile. No importar `RESONADORES` directamente salvo para tipos o la propia capa de fallback del hook.
