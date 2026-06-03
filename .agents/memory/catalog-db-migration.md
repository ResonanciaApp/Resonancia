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
  hay clave natural). Si cambia el shape del catálogo, regenerar el snapshot desde
  `data/*.ts`, no editar el seed a mano.
- `CatalogContext` es offline-first y NO bloquea render ni remonta el árbol; las
  pantallas importan los arrays síncronamente, así que cambios remotos se reflejan
  al re-renderizar (consistencia eventual), no instantáneamente.
- Tags se guardan como texto libre en DB; la validación de uniones vive en TS.
- Deuda conocida (no bloqueante): `sessionCount` está denormalizado y `categoryId`
  no tiene FK — endurecer al construir el panel de escritura (no en la app lectora).
