---
name: Controlled slider bounce on release
description: Por qué un slider Reanimated controlado rebota al soltar y cómo evitarlo
---

# Slider controlado (prop `value`) respaldado por SharedValue → rebote al soltar

`VolumeSlider` (barras de sensibilidad de Geometrix) corre en hilo UI con
`Gesture.Pan()` + `useSharedValue` y emite `onChange` por frame. El padre es
controlado: guarda el valor en estado y lo devuelve por el prop `value`.

**Síntoma:** al soltar el drag, el thumb rebota/glitchea.

**Causa:** un `useEffect` que hace `fraction.value = value` en CADA cambio del
prop re-sincroniza el SharedValue con los ECOS de nuestro propio `onChange`.
Durante el arrastre el SharedValue (gesto) y el prop (eco con lag) pelean por la
posición → salto visible al soltar.

**Fix (los tres elementos juntos):**
1. Flag `draggingRef` (React ref, hilo JS) seteado con `runOnJS(startDrag)` en
   `onBegin` y `runOnJS(endDrag)` en `onFinalize`. El `useEffect` retorna
   temprano si `draggingRef.current` → no re-sincroniza mientras se arrastra.
2. **Clave (FIFO):** limpiar el flag vía `runOnJS` en `onFinalize`, NO en el
   hilo UI. `runOnJS` es FIFO, así `endDrag` corre DESPUÉS de todos los ecos de
   `onChange` en cola. Si se limpiara en el hilo UI, queda causalmente ANTES de
   que drenen los ecos → un eco stale tras un flick rápido se cuela y rebota.
3. Guard de epsilon: solo `fraction.value = value` si
   `Math.abs(value - fraction.value) > 0.001`. Los ecos ya coinciden con la
   posición del thumb (los emitimos desde ahí) → se ignoran; un reset EXTERNO
   ("restablecer") sí difiere → sí mueve el thumb.

**Why:** el padre re-renderea ~5500 líneas (geometrix) por tick, así que el hilo
JS va por detrás del UI; el orden causal del flag importa.

**How to apply:** cualquier slider/control Reanimated controlado (prop de
vuelta) que sea source-of-truth por gesto necesita estos tres elementos; el flag
SIEMPRE por `runOnJS` (no en worklet/hilo UI) para el orden FIFO con los ecos.
