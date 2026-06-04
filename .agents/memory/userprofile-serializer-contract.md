---
name: UserProfile serializer contract
description: Hacer requerido un campo en un schema OpenAPI compartido obliga a tocar TODOS los serializers que lo producen
---

El schema `UserProfile` se serializa con un helper local `toProfile(u: User)` duplicado en varios routes del api-server: `users.ts`, `catalog.ts`, `friends.ts`, `notifications.ts`, `mixes.ts`, `dm.ts` (y se usa como `creator`/`actor`/`author`/`requester`/`addressee`/`friend`).

**Regla:** si agregás o hacés requerido un campo en `UserProfile` (u otro schema compartido) en `lib/api-spec/openapi.yaml`, tenés que actualizar TODAS las copias de `toProfile` a la vez, no solo la del endpoint nuevo.

**Why:** al hacer `createdAt` requerido en `UserProfile`, solo se actualizó `users.ts`/`catalog.ts`; friends/notifications/mixes/dm quedaron sin `createdAt` → contract drift (clientes con tipos generados reciben `undefined`). Lo detectó el code review, no el typecheck (los serializers son objetos literales sin anotación al tipo generado, así que TS no obliga).

**How to apply:** tras editar un schema compartido, `rg -n "function toProfile" artifacts/api-server/src/routes/` y alinear todas. Mejora futura: un único `toProfile` compartido en `lib/` tipado contra el schema generado para que el typecheck atrape el drift.
