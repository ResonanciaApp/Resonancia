---
name: Catalog DB migration
description: Por qué el catálogo se sirve desde DB pero los assets siguen bundleados
---

El catálogo (categorías, sesiones, metadata de audio) vive en Postgres y se sirve
por `GET /api/catalog` (público, solo `status = published`). La app lo hidrata
**in-place** sobre los arrays bundleados (`SESSIONS`/`CATEGORIES`) por id.

**Why:** se quería catálogo editable desde DB (futuro panel creador / Bunny) sin
perder arranque rápido ni offline, y sin tocar el player ni los mapeos de audio.

**Reglas durables:**
- Los **assets** (imágenes/audio) NO viven en DB: siguen bundleados y se resuelven
  por id en la app. La hidratación NUNCA debe sobreescribir `image`/`audio`. Por eso
  una sesión que existe en DB pero no en el bundle se ignora (no hay assets que
  resolver) → contenido nuevo requiere update de app hasta migrar assets a remoto.
- El seed es idempotente: upsert por id; audio = delete+insert por sessionId (no
  hay clave natural). NO hay extractor: `scripts/seed-catalog.ts` solo siembra, no
  regenera. El snapshot `lib/db/src/seed/catalog-data.ts` se mantiene **a mano** en
  lockstep con `data/*.ts`.
- **Cambios de taxonomía deben aplicarse a 3 sitios o quedan inconsistentes:** (1)
  los `data/*.ts` del mobile, (2) el snapshot del seed, y (3) la **DB dev en vivo**
  (executeSql). La app sirve la DB por encima del código (hidratación in-place), así
  que editar solo el código NO cambia lo que ve el usuario hasta re-seed o mutación
  directa. Prod la migra el flujo de Publish, no scripts.
- `CatalogContext` es offline-first y NO bloquea render ni remonta el árbol; las
  pantallas importan los arrays síncronamente, así que cambios remotos se reflejan
  al re-renderizar (consistencia eventual), no instantáneamente.
- Tags se guardan como texto libre en DB; la validación de uniones vive en TS.
- Deuda conocida (no bloqueante): `sessionCount` está denormalizado y `categoryId`
  no tiene FK — endurecer al construir el panel de escritura (no en la app lectora).
