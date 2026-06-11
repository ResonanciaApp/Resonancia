---
name: Geometrix category filter
description: Category filter for Geometrix carousel, z-order invariant, cross-category front, and mount strategy
---

El carrusel de Geometrix filtra por categoría: muestra SOLO los tiles de la categoría
activa (~9-20) en vez de las 44 a la vez, pero el FRENTE es cross-categoría.

**Why:** montar 44 geometrías de golpe bloquea el JS-thread. Filtrar reduce el árbol
montado por entrada. El frente cross-categoría permite ver selecciones de otras
categorías al cambiar de tab (UX correcto).

**Frente cross-categoría (diseño actual):**
- `frontIds` = ALL active, sin filtro de categoría.
- `carouselOrder` = all active (any cat) first + inactive de la categoría actual.
- `domOrder` = catBases (cat actual) + otherActiveBases (activas de otras cats, para el
  DOM del frente) + activeDups (cualquier cat).
- Grid width = `carouselOrder.length * tileItemW` (NO `domOrder.length`).

**Montaje progresivo cross-categoría (mountedIdsRef):**
- `mountedIdsRef` (ref, no state): acumulador que NUNCA decrece; registra tiles tras
  cada render (useEffect `[tilesToRender]`). Al cambiar de categoría, `newTilesInDom`
  = domOrder.filter(!in ref) → solo las tiles REALMENTE NUEVAS se batch-mountan.
- `tilesToRender` = alreadyMounted (inmediatas) + newBatch progresivo + bgPreloaded (ocultas).
- Tiles pre-cargadas en background (`bgPreloadedIds` state): 1.5 s después de que la
  categoría actual carga, se montan 2 tiles/frame de otras cats (slot=-1 → opacity:0).
  Al primer switch las tiles ya están montadas → switch instantáneo.
- `newTilesInDom` useMemo solo depende de `[domOrder]` (no del ref) para no crear loop.

**INVARIANTE de z-order al reordenar (moveActiveTo):**
El array `active` ES el z-order global (todas las categorías comparten canvas). Reordenar
drag&drop dentro de la categoría visible debe PERMUTAR solo los items de esa categoría
dentro de los slots que ya ocupan en `active`; los de otras categorías quedan exactos.
NO hacer `splice(without.length)`: mueve la capa por delante/detrás de otras categorías.

**Al cambiar de categoría:** resetear scroll (`carScrollX=0` + `scrollTo(0)`);
`carMaxScrollX` se refresca con `onContentSizeChange`.
