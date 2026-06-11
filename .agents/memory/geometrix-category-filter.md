---
name: Geometrix category filter
description: Why the Geometrix carousel renders one category at a time, and the z-order invariant when reordering within a filtered carousel
---

El carrusel de Geometrix filtra por categoría: muestra SOLO la categoría activa
(~9-20 tiles) en vez de las 44 a la vez.

**Why:** montar las 44 geometrías de golpe al entrar a la tab bloquea el JS-thread
(lag visible al abrir). Filtrar reduce el árbol montado por entrada.

**How to apply:**
- Las categorías y el campo `category` viven en `data/geometries.ts` (`categoryOf(id)`
  usa `baseOf`, default la última). El estado `activeCategory` filtra `carouselOrder`,
  `domOrder` y `frontIds`.
- INVARIANTE de z-order al reordenar dentro de una categoría filtrada: el array
  `active` ES el z-order global (todas las categorías comparten canvas). Reordenar
  drag&drop dentro de la categoría visible debe PERMUTAR solo los items de esa
  categoría dentro de los slots que ya ocupan en `active`; los items de otras
  categorías quedan en su índice exacto. NO hacer `splice(without.length)` ni insertar
  al final del array completo: eso mueve la capa por delante/detrás de las demás
  categorías y rompe el z-order entre categorías (bug encontrado en review).
- El `idx` del drop es RELATIVO al frente de la categoría visible, no al array `active`.
- Montaje progresivo (batch) corre SOLO en la primera entrada; una vez `fullyMounted`,
  los cambios de categoría renderizan el `domOrder` completo de golpe.
- Al cambiar de categoría resetear el scroll del carrusel (`carScrollX=0` + `scrollTo(0)`);
  `carMaxScrollX` se refresca con `onContentSizeChange`.
