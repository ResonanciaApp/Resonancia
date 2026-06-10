---
name: Geometrix rotation cardinal indicator + microlag
description: Por qué el giro de 2 dedos en Geometrix no debe usar runOnJS/estado React por frame, y cómo se muestra el color cardinal del ángulo.
---

# Geometrix — giro de 2 dedos: microlag y color cardinal

## Regla
Durante un gesto de alta frecuencia (rotación con 2 dedos en el lienzo de
Geometrix) NO escribir estado React por frame, y mucho menos vía `runOnJS`.
- El número del badge de ángulo se pinta con `useAnimatedProps` sobre un
  `AnimatedTextInput = Animated.createAnimatedComponent(TextInput)` (patrón
  "ReText"): el texto se actualiza en el UI thread leyendo `liveRot`, sin
  re-render. El prop `text` no está en `TextInputProps` → cast `as any`.
- El color cardinal (azul `#171e5a` + borde dorado `#D6A85B`) lo escribe UN
  ÚNICO `useAnimatedReaction` que es el **único escritor** de `pillCardinalSV`.
  Lee `{ rotActive, liveRot, rotHasTargetSV }`:
  - `rotActive>0` (girando): zona amplia 8° como "pista".
  - en reposo (`rotActive==0`, cuando `liveRot` ya refleja el ángulo confirmado
    por el useEffect de sync): cardinal exacto 0.5°.
  - `rotHasTargetSV==0` (sin geometría seleccionada): nunca cardinal.
  Un guard SV (`rotCardGuard`, reset a -1 en `onStart`) limita el `withTiming`:
  solo anima al CRUZAR el umbral, no en cada frame.

## Why
El `useAnimatedReaction` original corría cada frame y disparaba DOS `runOnJS`
(setRotDisplayAngle + setPillAtCardinal) → re-render del componente gigante
(~5000 líneas) por frame = microlag perceptible al rotar. Además la regla de
color vivía solo en la píldora de acciones (`pillRow`), que está colapsada
durante el giro (necesitás 2 dedos en el lienzo) → el usuario nunca la veía.

## How to apply
- Si tenés que reconciliar `pillCardinalSV` tras soltar/cancelar, hacelo desde
  la MISMA reacción leyendo `liveRot` (que vuelve al ángulo confirmado por
  `onFinalize` en cancelación y por el useEffect de sync en commit/cambio de
  objetivo). NO encadenar estado React → effect → SV: si el estado cardinal no
  cambia (p.ej. soltás a 85°, dentro de la zona de 8° pero fuera de 0.5°), el
  effect no corre y el SV queda pegado en azul.
- Cualquier writer extra de `pillCardinalSV` (effects que dependían de `settings`)
  reintroduce desincronización y conflictos de orden de effects. Mantené la
  reacción como único escritor.
