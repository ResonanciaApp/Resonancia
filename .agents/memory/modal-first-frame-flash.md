---
name: RN Modal first-frame flash (animationType none + Animated entrance)
description: Por qué un bottom-sheet en <Modal animationType="none"> flashea contenido/overlay al abrir, y cómo matarlo.
---

# Modal first-frame flash al abrir un bottom sheet

## Síntoma

Al reabrir un `<Modal>` con `animationType="none"` cuya entrada se anima con
`Animated` (translateY de abajo→0 + dim de fondo), el PRIMER frame muestra el
contenido en su posición final (translateY=0, full-screen) y/o el dim a opacidad
completa, y recién DESPUÉS salta a la posición cerrada y se desliza. Se percibe
como un flash de la imagen de fondo "cayendo desde arriba" o un overlay negro que
parpadea (más obvio en tema claro porque el dim oscuro contrasta).

## Causa

El contenido nativo del Modal pinta su primer frame con el valor RESIDUAL del
`Animated.Value` (el que quedó del último cierre, típicamente 0 = abierto), ANTES
de que el `setValue(offscreen)` del `useLayoutEffect` se confirme en el lado
nativo. `useLayoutEffect` no gana esa carrera contra la presentación nativa del
Modal. El dim, si vive como `backgroundColor` estático en el backdrop, aparece a
opacidad completa de golpe.

## Fix (regla)

1. **Resetear los Animated.Value de entrada al estado CERRADO cuando la hoja se
   cierra** (rama `else` del effect con dep en el flag de apertura): translateY a
   `window.height`, dim a 0. Así el primer frame del próximo montaje ya es
   correcto, gane o pierda la carrera el `useLayoutEffect`.
2. **El dim de fondo debe ser un `Animated.View` con `opacity` propia que se
   desvanece HACIA dentro junto al slide** (no un `backgroundColor` estático en el
   backdrop), o flashea de golpe. `pointerEvents="none"` para no robar taps.
3. La rama de reapertura instantánea (sin slide) setea translateY=0 **y** dim=1 a
   la vez para preservar ese camino.

**Why:** confiar solo en `useLayoutEffect` para armar la entrada no alcanza con
Modals nativos; el estado de reposo del valor animado tiene que ser ya el cerrado.

**How to apply:** cualquier bottom sheet propio en `<Modal animationType="none">`
con entrada por `Animated` (ej. `components/MixerSheet.tsx`). No aplica a
`animationType="slide"` (lo anima el nativo).
