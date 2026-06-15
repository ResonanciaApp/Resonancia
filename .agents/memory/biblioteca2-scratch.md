---
name: biblioteca2 experimentation copy
description: biblioteca2 es una copia de scratch de la biblioteca para probar animaciones de tabs; no es feature productiva
---

`app/(tabs)/biblioteca2.tsx` es una **copia de experimentación** de `biblioteca.tsx`, creada para iterar animaciones de los tabs internos sin tocar la pantalla real.

**Cómo se accede:** tab oculta (`href: null` en `(tabs)/_layout.tsx`). Ícono de capas (layers) en el header de `biblioteca.tsx` → navega a ella; ícono "corner-up-left" en `biblioteca2.tsx` → vuelve.

**Hereda** el error de TS preexistente `role` (~línea 1116, igual que biblioteca ~993) — ignorar.

**Animación de chips de filtro (AnimatedChipRow):** un solo `Animated.Value progress` (0 sin filtro, 1 filtrado, duración 600ms, `Easing.inOut(cubic)`) maneja ida y vuelta. El chip seleccionado traslada con `translateX` interpolado a un `targetTranslate` (px) calculado en el tap como `CLOSE_SLOT - (offsetMedido - scrollX)`; los demás hacen fade out (opacity 1→0). `displayTab` (estado) se conserva durante el regreso para no desmontar el chip antes de que vuelva a su lugar; se limpia en el callback `onDone` del `animate(0)`. `sel` se deriva de `displayTab` (no de `activeTab`) para que el oro persista mientras vuelve.

**Cuando el usuario apruebe una animación aquí, portarla a `biblioteca.tsx`.**
