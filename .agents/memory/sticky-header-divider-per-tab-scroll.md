---
name: Sticky header divider must be wired to every tab's ScrollView
description: A scroll-triggered header divider (opacity animates in after N% scroll) needs its onScroll handler wired to EVERY ScrollView that can be visible under that header, not just the default tab
---

Cuando un divisor de sticky-header solo aparece tras cierto % de scroll
(patrón: `Animated.Value` + `onScroll` que compara `contentOffset.y` contra
`contentSize - layoutHeight`), y el header persiste visualmente a través de
varias pestañas (ej. un `perfilTab` que cambia el cuerpo pero no el header):

**Extraer el handler de scroll a una función compartida** (no un handler
inline por `ScrollView`) y pasarlo a **cada** `ScrollView` que pueda quedar
debajo de ese header — incluidas pestañas secundarias con su propio
`ScrollView` (ej. "Historial", "Registros"). Si una pestaña tiene su propio
componente embebido con scroll interno propio (ej. una pantalla completa
reutilizada), esa pestaña queda fuera del patrón salvo que el componente
exponga un callback de scroll — anotarlo como limitación conocida en vez de
forzarlo.

**Why:** un usuario reportó "la línea divisora no se ve" en una pantalla
donde el patrón ya estaba community-probado en otra pantalla similar
(mismo threshold/animación). La causa real no era opacidad ni z-index sino
que solo el `ScrollView` de la pestaña por defecto tenía el `onScroll`
conectado — en las demás pestañas el valor animado nunca se disparaba y
quedaba en opacity 0 permanentemente.

**How to apply:** al depurar "el borde/línea no aparece" en un header
compartido entre pestañas, primero verificar CUÁNTOS `ScrollView`/`FlatList`
distintos puede haber debajo del header y si todos disparan el mismo
handler, antes de sospechar de color/opacidad/zIndex.

**Update:** incluso con el handler cableado en todas partes, un umbral
basado en **% del contenido scrolleable** (`y / (contentHeight - layoutHeight)`)
sigue fallando en pestañas cortas cuyo contenido casi no scrollea (ej. una
lista de 6 ítems que cabe casi entera en pantalla) — `scrollable` puede ser
pequeño o negativo y el % nunca cruza el umbral. Preferir un umbral en
**píxeles absolutos** (`y >= 8`) en vez de porcentaje: es válido siempre,
sin importar cuánto contenido haya. Para pestañas que embeben una pantalla
completa reutilizada con su propio `ScrollView` interno (ej. Biblioteca),
exponer `onScroll`/`scrollEventThrottle` como props opcionales pass-through
en ese componente para conectarlo al mismo handler compartido.

**Además:** el divisor debe estar SIEMPRE montado y togglear solo `opacity` (nunca montarse condicionalmente): al montarse añade su hairline de alto al header → la grilla de abajo "rebota" al cruzar el umbral de scroll.
