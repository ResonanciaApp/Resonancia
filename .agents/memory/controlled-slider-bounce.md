---
name: Controlled slider bounce (VolumeSlider)
description: Causa real del rebote al soltar una barra Reanimated controlada por prop, y el fix definitivo.
---

## El bug y sus variantes

Un slider Reanimated "controlado" (el padre guarda el valor en estado y lo pasa
como prop `value`) sufre rebote en la secuencia rápida onUpdate → onFinalize:

### Race cross-thread (causa real)

1. UI thread `onUpdate`: `lastEmit.value = 0.74`, encola `runOnJS(emit)(0.74)`
2. UI thread `onUpdate`: `lastEmit.value = 0.75`, encola `runOnJS(emit)(0.75)`
3. UI thread `onFinalize`: `|0.75-0.75| ≤ 0.001` → sin emit adicional
4. JS: `emit(0.74)` → state → `value={0.74}` → `useEffect` lee `lastEmit.value`
   — si `lastEmit` es un **SharedValue**, el hilo UI ya escribió 0.75 pero la
   copia JS puede devolver 0.75 → `|0.74-0.75|=0.01>0.001` → `fraction.value=0.74` **REBOTE**
5. JS: `emit(0.75)` → `value={0.75}` → useEffect → snap de vuelta a 0.75

El usuario ve: thumb salta a 0.74 → 0.75. Bounce de 1 frame.

**Por qué pasa:** `useSharedValue` es un canal cross-thread; el hilo UI puede
haber escrito el valor del onUpdate siguiente ANTES de que JS procese el emit
del onUpdate anterior. La "copia JS" del SharedValue es inconsistente con el
estado de la cola de runOnJS.

## Fix definitivo: useRef JS-puro para el echo-guard del useEffect

```ts
const lastEmitSV = useSharedValue(value);  // throttle en onUpdate (worklet)
const lastEmitRef = useRef(value);          // echo-guard en useEffect (JS-puro)

const emit = useCallback((v: number) => {
  // Actualizar ANTES de onChange → antes del re-render → useEffect ve diff=0
  lastEmitRef.current = v;
  onChangeRef.current(v);
}, []);

useEffect(() => {
  if (Math.abs(value - lastEmitRef.current) > 0.001) {
    fraction.value = value;
    lastEmitRef.current = value;
  }
}, [value, fraction]);

// onFinalize: SIEMPRE emitir el valor final (aunque lastEmitSV coincida)
.onFinalize(() => {
  const f = fraction.value;
  lastEmitSV.value = f;
  runOnJS(emit)(f);
})
```

**Why:** `lastEmitRef` es JS-puro. `emit` lo actualiza síncronamente ANTES de
llamar `onChange`. React re-renderiza con el nuevo `value` que coincide con
`lastEmitRef.current` → diff = 0 → `useEffect` → skip. Sin ventana cross-thread,
sin race, sin bounce.

`onFinalize` siempre emite (no condicional) para garantizar que el padre quede
en sync aunque el último `onUpdate` no llegara a emitir por el throttle EMIT_EPS.

**How to apply:** cualquier slider Reanimated controlado por prop debe usar
`useRef` (no `useSharedValue`) para el echo-guard del `useEffect`, y actualizar
ese ref en el callback JS ANTES de llamar al setter de estado del padre.

## Anti-patrón: isDragging + useAnimatedReaction

El enfoque anterior (isDragging SharedValue + useAnimatedReaction + clearDragging
via runOnJS) tenía el mismo problema: `isDragging.value = 0` se escribía desde
onFinalize (UI thread), pero el React render causado por el último emit procesado
en JS podía correr con `isDragging.value` todavía como 1 en la copia JS. Solo
funciona con valores 0/1 si la propagación cross-thread llega antes del render,
lo cual no está garantizado.
