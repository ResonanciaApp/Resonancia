---
name: Shared-mix likes denormalization + trending ordering
description: La columna shared_mixes.likes es denormalizada y alimenta orden y trending; debe recalcularse bajo row lock
---

El feed de "Mezclas de la comunidad" (`GET /mixes`) ordena por `likes DESC, createdAt DESC` (depende de la columna **denormalizada** `shared_mixes.likes`). El flag `trending` NO usa el total denormalizado: cuenta los likes de la **ventana reciente** (`TRENDING_WINDOW_DAYS=7`) desde `shared_mix_likes.createdAt` y lo compara con `TRENDING_THRESHOLD=3`. Se recomputa en `GET /mixes` (param `trending` del serialize) y en la respuesta del toggle de like.

**Regla:** el toggle de like (`POST /mixes/:id/like`) recalcula `likes` desde `COUNT(*)` de `shared_mix_likes` dentro de una transacción que **primero bloquea la fila de la mezcla con `SELECT ... .for("update")`**.

**Why:** sin el row lock, bajo `READ COMMITTED` dos toggles concurrentes pueden contar sin verse y persistir un conteo viejo → `likes` se desincroniza del conteo real, corrompiendo orden y trending. Antes el desajuste era cosmético (orden era por recencia); al pasar a orden por popularidad se volvió correctness.

**How to apply:** cualquier nueva ruta que modifique `shared_mix_likes` debe recomputar `likes` bajo el mismo lock. Si agregás otro campo derivado de likes, recalcularlo en la misma transacción.

**Mínimo de sonidos al compartir:** input exige `min(2)` sonidos en 3 lugares sincronizados (drizzle-zod `insertSharedMixSchema`, OpenAPI `SharedMixInput.minItems`, guard cliente en `MixActionsSheet`). El cap superior sigue en 10 (ver shared-mix-category-enum.md).
