---
name: Catalog boolean flags — only-if-true
description: DB boolean flags (skipDetail/skipMiniPlayer/isLoop) must only be applied to mobile sessions when true; false clobbers bundled values and category defaults
---

La BD (`catalog_sessions`) usa columnas boolean NOT NULL DEFAULT false para
`skip_detail`, `skip_mini_player`, `is_loop`. El cliente NO puede distinguir
"nunca tocado" de "explícitamente false".

**Regla:** `applyCatalogSnapshot` solo asigna estos flags cuando el remoto es
`true`. Un `false` remoto NO debe escribirse:
- Fase 1 (sesiones bundleadas): `if (r.skipDetail) local.skipDetail = true;`
- Fase 2 (sesiones DB-only): `skipDetail: r.skipDetail ? true : undefined`

**Why:** `SessionCard` usa lógica de tres estados: `skipDetail !== false &&
(skipDetail === true || SKIP_DETAIL_CATS.includes(categoryId))`. Un `false`
explícito del snapshot rompía el default de categoría (sonidos-ancestrales y
musica-sonidos van directo al player) y clobbeaba los `skipDetail: true`
hardcodeados de los bundles → las sesiones abrían pantalla de detalle.

**Otros gotchas relacionados:**
- El check de `skipMiniPlayer` está duplicado en ~22 sitios, incluidos los
  onPress INLINE de los carruseles dentro de las pantallas de categoría
  (Recientes/Favoritos/sub-tabs) — no solo los handlers principales.
- En `playSession` el trigger del miniplayer (`triggerShow`) debe ir ANTES
  del early-return del path isLoop, o sesiones con ambos flags no muestran
  el miniplayer.
- El formulario admin de edición debe bloquearse mientras `isFetching`
  (React Query sirve caché stale) o un guardado con estado stale REVIERTE
  los flags a false en la BD — así se "des-guardaron" solos varias veces.
