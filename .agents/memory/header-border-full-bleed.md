---
name: Sticky header divider full-bleed positioning
description: Border/divider lines inside a padded header column must be placed in normal flow with negative marginHorizontal, not absolutely positioned inside a padded child
---

Cuando un header tiene `paddingHorizontal` (ej. 20) y se necesita una línea
divisoria que llegue al borde real de la pantalla (edge-to-edge) en el punto
exacto entre dos secciones (ej. entre chips de filtro y fila de resultados):

**No** la pongas `position:"absolute"` dentro de un hijo ya insetado por el
padding del header — queda igual de insetada (o se desalinea si el hijo tiene
padding/gap propio) y no llega al borde de la pantalla.

**Sí**: colócala como elemento normal en el flujo (sibling, no absoluto) en el
punto exacto del JSX donde debe aparecer visualmente, con
`marginHorizontal: -paddingHorizontalDelHeader` para que "sangre" fuera del
padding hasta el borde real de pantalla. Mantener `collapsable={false}` en el
`Animated.View` si anima opacidad (ver `expo-router-tab-group-back-nav`/view
flattening).

**Why:** un usuario reportó que el borde "aparecía más abajo" tras moverlo a
un contenedor con padding — la posición en flujo normal es predecible; la
absoluta depende del box del padre inmediato, que rara vez es el que se
espera cuando hay padding anidado.
