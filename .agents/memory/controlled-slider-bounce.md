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
4. **Gesto estable (anti-rebote por re-render):** `onChange` en `onChangeRef`
   (`onChangeRef.current = onChange` cada render) + dispatcher `emit` estable
   (`useCallback([])`), y construir `Gesture.Pan()` UNA vez con `useMemo` (deps =
   callbacks estables + SharedValues). Si el gesto se rearma con un `onChange`
   inline nuevo en cada render del padre (que re-renderea por frame durante el
   drag), el `GestureDetector` cambia el handler activo a mitad de gesto →
   stutter/rebote. NO volver a inline-arrow el `onChange` ni rearmar el gesto.
5. **Throttle por delta (no por reloj):** en `onUpdate` solo `runOnJS(emit)`
   cuando `|f - lastEmit| >= 0.01` (`lastEmit` = SharedValue, se reinicia en
   `onBegin`). El thumb sigue al dedo a 60 fps igual (hilo UI); lo que se acota
   son los re-renders de React. NADA de `Date.now()`/`performance.now()` en el
   worklet (no fiables). **Emisión final OBLIGATORIA** en `onFinalize` (si
   `fraction.value !== lastEmit.value`) ANTES de `runOnJS(endDrag)` → por FIFO el
   prop `value` iguala al thumb al limpiar el flag → guard de epsilon no-opea →
   sin rebote. Caveat aceptable: drags rápidos (~0.016/frame) superan el gate y
   emiten casi por frame, pero con `React.memo` en las capas eso es barato.

**Why:** el padre re-renderea ~6500 líneas (geometrix) por tick, así que el hilo
JS va por detrás del UI; el orden causal del flag importa, y un gesto re-armado a
mitad de drag reintroduce el rebote que los puntos 1–3 ya habían matado.

**How to apply:** cualquier slider/control Reanimated controlado (prop de
vuelta) que sea source-of-truth por gesto necesita los 5 elementos; el flag
SIEMPRE por `runOnJS` (no en worklet/hilo UI) para el orden FIFO con los ecos.
