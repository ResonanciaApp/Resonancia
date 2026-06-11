---
name: Controlled slider bounce (VolumeSlider)
description: Causa real del rebote al soltar una barra Reanimated controlada por prop, y el fix UI-thread definitivo.
---

## El bug

Un slider Reanimated "controlado" (el padre guarda el valor en estado y lo pasa
como prop `value`) tiene esta race condition con `draggingRef` (JS thread):

1. Worklet `onBegin`: encola `runOnJS(startDrag)` → cola JS.
2. Worklet `onBegin`: encola `runOnJS(emit)(f)` → cola JS (FIFO después de #1).
3. JS: `startDrag()` corre → `draggingRef.current = true`.
4. JS: `emit(f)` → `setState(f)` → React agenda re-render.
5. React re-renderiza → prop `value = f` → `useEffect([value])` corre.

En React 18 + RN New Arch (Fabric + JSI), los pasos 3 y 5 compiten. Si la
ventana de re-render de React llega ANTES de que `startDrag` haya corrido en el
JS thread, el `useEffect` ve `draggingRef.current = false` y sobrescribe
`fraction.value` con el prop → rebote visual al soltar o durante el drag.

## Fix definitivo: flag en el UI thread (isDragging SharedValue)

Reemplazar `draggingRef` (JS thread) con `isDragging = useSharedValue(0)` (UI
thread) y `useEffect` con `useAnimatedReaction`.

```ts
const isDragging = useSharedValue(0);
const externalFraction = useSharedValue(value);

// Sincroniza el prop al SV (JS thread, solo actualiza el espejo)
useEffect(() => { externalFraction.value = value; }, [value, externalFraction]);

// Reacción en UI thread — lee isDragging en el MISMO hilo que el gesto
useAnimatedReaction(
  () => externalFraction.value,
  (next, prev) => {
    if (isDragging.value === 0 && prev !== null && Math.abs(next - fraction.value) > 0.001) {
      fraction.value = next;
    }
  },
  [fraction, isDragging],
);

// En el gesto (worklet = UI thread):
.onBegin(() => {
  isDragging.value = 1; // ← ANTES de runOnJS(emit); mismo hilo que la reacción
  ...
})
.onFinalize(() => {
  ...
  isDragging.value = 0; // ← en worklet, no en runOnJS(endDrag)
})
```

**Why:** `isDragging.value = 1` se ejecuta síncronamente en el worklet (UI
thread) antes de que `runOnJS(emit)` llegue al JS thread. La reacción que
sincroniza el prop también corre en el UI thread y siempre ve el estado actual
de `isDragging`. Sin race, sin rebote.

## Carousel scroll microlag (tiles seleccionadas)

**Causa original (fix 1):** `shadowOpacity: glow.value` en el Animated.View del
glifo → iOS recalcula la sombra CADA frame de scroll (sin shadowPath = recálculo
por desplazamiento).

**Causa persistente (fix 2):** el Animated.View halo de reemplazo (opacity:
0.66 constante) también fuerza un pase de composición offscreen per-frame en
iOS cuando el tile se mueve, porque tiene una subcapa SVG y opacity < 1. El
glifo SVG (SacredGlyph complejo) tampoco tenía caché de rasterización.

**Fix:** `shouldRasterizeIOS + renderToHardwareTextureAndroid` en AMBOS
Animated.View (halo y glifo). Core Animation pre-rasteriza cada capa en un
bitmap una sola vez y los traduce durante scroll sin composición por frame.
El bitmap se invalida solo cuando cambia el contenido animado (glow/scale
durante selección), no en cada frame de scroll.

**How to apply:** cualquier Animated.View con opacity < 1 que contenga SVGs u
otras subcapas complejas y se mueva en un ScrollView → agregar
shouldRasterizeIOS + renderToHardwareTextureAndroid para pre-cachear el bitmap.
