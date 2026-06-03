---
name: Shared mix category enum
description: Al cambiar el set de categorías de mezclas compartidas, qué lugares hay que sincronizar para no romper compartir/filtrar
---

El conjunto de categorías de mezclas de "Mi Música" (compartir a la comunidad) está duplicado en **5 lugares** que deben quedar sincronizados, o compartir/filtrar una categoría nueva falla silenciosamente:

1. `lib/db/src/schema/shared-mixes.ts` → `SHARED_MIX_CATEGORIES` (alimenta `z.enum` de `insertSharedMixSchema`, valida el POST).
2. `lib/api-spec/openapi.yaml` → **3 enums**: query param `category`, schema `SharedMix.category`, schema del input de crear.
3. `artifacts/api-server/src/routes/mixes.ts` → const local `CATEGORIES` (whitelist del filtro `GET /mixes?category=`; si no incluye el valor, el filtro cae a `null` y muestra todo).
4. `artifacts/mobile/data/mix-categories.ts` → tipo `MixCategory` + `MIX_CATEGORIES` (lo que ve el usuario).
5. `artifacts/mobile/app/mezclas/[category].tsx` → cast de `category` en el payload de `shareMix.mutate`.

**Why:** la categoría `concentracion` (etiqueta "Enfoque") existía en el frontend pero el contrato del backend solo conocía `[dormir, trabajar, motivarme]`, así que compartir una mezcla "Enfoque" era rechazada por el servidor.

**How to apply:** tras tocar los enums, correr `pnpm --filter @workspace/api-spec run codegen` (regenera api-zod + api-client-react) y reiniciar el workflow expo (el clean del codegen rompe el cache de Metro). `category` es columna `text` (no enum de Postgres) → NO requiere `db push`. `trabajar` es categoría legacy: existe en el enum pero no se muestra en `MIX_CATEGORIES`.
