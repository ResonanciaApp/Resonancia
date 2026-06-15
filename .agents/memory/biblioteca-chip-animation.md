---
name: biblioteca filter chip animation
description: animación de chips de filtro en biblioteca.tsx (AnimatedChipRow) — patrón de un solo progress ida-y-vuelta con color desacoplado
---

En `app/(tabs)/biblioteca.tsx`, los chips de filtro de tab usan el componente **AnimatedChipRow**.

**Patrón:** un único `Animated.Value progress` (0 sin filtro, 1 filtrado, 600ms, `Easing.inOut(cubic)`) maneja ida y vuelta. El chip seleccionado traslada con `translateX` interpolado a `targetTranslate` (px) calculado en el tap como `CLOSE_SLOT - (offsetMedido - scrollX)`; los demás hacen fade out (opacity 1→0). La X de cerrar aparece con fade (opacity = progress) en el margen.

**Dos estados desacoplados, clave para que se vea bien:**
- `displayTab` — qué chip se muestra/posiciona; se CONSERVA durante el regreso y se limpia en el callback `onDone` de `animate(0)`, para que el chip vuelva a su lugar antes de desmontarse.
- `colorTab` — qué chip se ve en oro (`sel`). Cambia al INSTANTE del tap (oro al seleccionar, gris al deseleccionar) — NO espera a que termine la animación. El usuario pidió explícitamente que el color cambie al tocar, no al llegar.

Cleanup: `useEffect(() => () => progress.stopAnimation(), [progress])` evita callbacks tardíos si se desmonta a mitad de transición.

Histórico: se prototipó en una copia `biblioteca2.tsx` (ya eliminada) y se promovió a la pantalla real al aprobarse.
