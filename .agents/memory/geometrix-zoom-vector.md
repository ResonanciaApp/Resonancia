---
name: Geometrix zoom = render size, not transform
description: How magnification is applied to sacred-geometry layers so vectors stay crisp
---

Para escalar una capa de geometría (SVG vectorial), la magnificación CONFIRMADA se pliega en el tamaño REAL de render del SVG (`effectiveSize`), NO en un `transform: scale()`.

**Why:** un `transform: scale()` sobre el Animated.View que envuelve el SVG estira la capa ya rasterizada → el trazo engorda proporcional y se pixela. Redibujar el SVG al tamaño grande lo mantiene nítido y, al recalcular strokeWidth desde el tamaño efectivo, el grosor VISUAL queda constante.

**El pellizco EN VIVO usa `transform: scale` (excepción acotada):**
Durante el gesto el objetivo aplica `pinchScale = liveZoomSV.value / safeZoom` en el `useAnimatedStyle`, directamente en el UI thread (sin `runOnJS` por frame). Al confirmar (`onEnd`), React re-renderiza con el nuevo `safeZoom = livePinch.value`, por lo que el closure de `useAnimatedStyle` se actualiza y `pinchScale → 1` automáticamente. El `effectiveSize` pasa a `size * safeZoom_nuevo`, que es idéntico al tamaño visual que había durante el pellizco → **sin fantasma y sin runOnJS por frame**.

**Why (antes: runOnJS por frame causaba micro-lag):** `runOnJS(setLivePinchNum)` en `onUpdate` → JS thread → setState → re-render → 3 SacredGlyph redraws → lag de 1-2 frames perceptible. Eliminado: `liveZoomSV` (SharedValue) pasa directo a `useAnimatedStyle` en el UI thread.

**Why (la carrera no existe con este patrón):** `livePinch.value` al soltar = zoom confirmado (`commitZoom` en `onEnd`). Cuando React re-renderiza, `safeZoom` capturado en el closure = ese mismo valor. `pinchScale = livePinch / safeZoom = 1` y `effectiveSize = size * safeZoom` → tamaño visual idéntico. No hay "carrera" de dos operaciones en threads distintos porque el committed path y el live path convergen al mismo resultado.

**How to apply:**
- `effectiveSize = size * userScale * safeZoom` (zoom confirmado, estable entre renders).
- `base1px = 100 / effectiveSize` → trazo visual constante.
- `aStyle.transform.scale = breatheScale * pinchScale` donde `pinchScale = liveZoomSV ? liveZoomSV.value / safeZoom : 1`.
- `liveZoomSV` = `livePinch` (SharedValue del padre) solo para la capa seleccionada; `undefined` para el resto.
- Pinch: `onUpdate` → solo `livePinch.value = z` (UI thread puro). `onEnd` → `runOnJS(commitZoom)`. `onFinalize` → `isPinching.value = false` (sin `setLivePinchNum`).
- `SacredGlyph` va en `React.memo`: sin re-renders intermedios en las otras capas durante el pellizco.

**Misma regla en el carrusel de cards:** el "lift" al arrastrar NO debe ser `transform: scale` — pixela el SVG rasterizado. Usar `translateY` como afordancia de "levantar".
