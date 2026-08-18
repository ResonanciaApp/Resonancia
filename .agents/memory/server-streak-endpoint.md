---
name: server-streak-endpoint
description: GET /me/streak endpoint — cómo funciona y lecciones del codegen
---

# Server-side streak endpoint

## Regla
`GET /me/streak?tz=<IANA>` devuelve `{ currentStreak, maxStreak, weekFlags, weekCount, todayIndex, totalActiveDays }` calculados en el servidor desde `playbackHistoryTable`.

**Why:** Anti-spoofing. El cliente enviaba eventos sin validación; ahora el servidor también filtra minutos > 180 y timestamps futuros (> 5 min) en `POST /me/plays`.

## Lección: Orval + Zod v3/v4
`lib/api-spec/package.json` tenía `"orval": "^8.9.1"` pero se actualizó a 8.23.0 que genera Zod v4 (`zod.int()`, `zod.url()`, `zod.looseObject()`). El servidor crasheaba con `TypeError: (void 0) is not a function`.

**Fix aplicado:**
1. Parche sed en `lib/api-zod/src/generated/api.ts`: `zod.int()` → `zod.number().int()`, `zod.url()` → `zod.string().url()`, `zod.looseObject(` → `zod.object(`.
2. Pin exacto en `lib/api-spec/package.json`: `"orval": "8.9.1"` (sin `^`).

**How to apply:** Si se vuelve a correr codegen y el servidor no arranca, verificar el archivo generado con `grep -c "zod.int()" lib/api-zod/src/generated/api.ts` y aplicar el parche sed nuevamente.

## Fallback mobile
Mobile usa `streakQ.data?.currentStreak ?? computeCurrentStreak(statEvents)` — servidor cuando hay conexión, local cuando offline. `useAuth().isSignedIn` como guard del query.

## Archivos
- `artifacts/api-server/src/routes/activity.ts` — endpoint + helpers + validación
- `lib/api-spec/openapi.yaml` — path `/me/streak` + schema `StreakResponse`
- `lib/api-client-react/src/generated/` — hook `useGetMyStreak` generado
- `lib/api-zod/src/generated/api.ts` — parcheado (zod v3 compatible)
- `artifacts/mobile/app/(tabs)/inicio8.tsx` — consume server streak
- `artifacts/mobile/app/progreso.tsx` — consume server streak
