---
name: Geometrix carousel selection order
description: How the Geometrix tile carousel decides order/glow when geometries are (de)selected, and why order is derived not mutated
---

El carrusel de geometrías (pantalla Geometrix) replica el comportamiento del mockup
"Aurora Equilibrado": al seleccionar una tile se enciende con su color + resplandor
EN SU LUGAR durante ~1s (HOLD), y recién después se desliza al frente (en orden de
selección).

**Auto-scroll: DESACTIVADO por preferencia del usuario.** El carrusel NO acompaña a
la geometría con scroll: la vista se queda estática en su lugar; solo la tile se
desliza al frente. (Se implementó el auto-scroll y luego el usuario pidió quitarlo.)
Si se reactiva: calcular slot = `front.indexOf(id)` y `scrollTo({x: max(0,
insertAt*(tileW+8)-tileW)})` dentro de un `requestAnimationFrame`.

**Regla central:** el orden del carrusel se DERIVA de forma determinista, NO se muta.
`carouselOrder = [seleccionadas-que-ya-terminaron-su-activación (orden de selección),
...resto en orden natural]`. Las que están "activándose" (set `activatingIds`) quedan
fuera del frente → se mantienen en su slot natural mostrando el glow; al terminar el
HOLD salen del set y el orden derivado las lleva al frente. El glow se aplica SOLO a
tiles seleccionadas/activándose (bg/border de las no seleccionadas no cambia).

**Why:** un primer intento mutaba un `prevOrder` en el timer y bloqueaba la
reconciliación global mientras hubiera CUALQUIER activación pendiente
(`if (pending.size>0) return`). Eso rompía el requisito de que deseleccionar SIEMPRE
devuelve la geometría a su orden natural: si deseleccionabas una tile mientras otra
seguía en su HOLD, la deseleccionada quedaba atascada fuera de lugar.

**Gotcha Reanimated (layout):** NO usar `gap` en el flex row del carrusel. Las
animaciones de layout (`LinearTransition`) miden mal las posiciones con `gap` y la
tile no vuelve a su lugar al deseleccionar (queda "pegada" al frente). Usar margen
por tile (`marginRight`) en el wrapper animado en su lugar.

**How to apply:** mantené el orden como `useMemo(active, activatingIds)`. No agregues
un gate global de "pending" sobre la reconciliación. Para acompañar con scroll, calculá
el slot de aterrizaje como `front.indexOf(id)` (front = seleccionadas que NO están en
activatingIds) y hacé `scrollTo({x: max(0, insertAt*(tileW+8) - tileW)})` dentro de un
`requestAnimationFrame` para esperar al re-render del reorden. Activaciones concurrentes
= set explícito (no un único id). Timers en un `Map` ref para cancelarlos al
deseleccionar/limpiar/blur; el orden se reconcilia solo porque es derivado.
