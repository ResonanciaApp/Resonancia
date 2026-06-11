---
name: Geometrix Hold mode
description: Toggle manito que aplica todos los gestos del lienzo (pinch/rot/drag) a TODAS las capas activas simultáneamente.
---

## La regla

Cuando Hold está activo (`holdModeSV.value === 1`), los tres gestos bifurcan
dentro del worklet hacia shared values grupales (`holdScaleSV`, `holdRotDeltaDeg`,
`holdDragDeltaX/Y`) en lugar de los individuales del objetivo seleccionado.

## Arquitectura (en geometrix.tsx)

- **holdModeSV** — mirror SharedValue de `holdMode` state, sincronizado en useEffect.
  Leerlo en worklets es seguro (UI thread); no usar `holdMode` state dentro de
  handlers Gesture (son worklets).
- **7 shared values de Hold** — `holdScaleSV`, `holdScaleActive`, `holdRotDeltaDeg`,
  `holdRotActive`, `holdDragDeltaX`, `holdDragDeltaY`, `holdDragActive`.
- **GeometryLayer** recibe todos los hold SVs. `pinchScaleSV` (useDerivedValue) y
  `aStyle` (useAnimatedStyle) tienen rama Hold que toma precedencia.
- **CanvasLayer** recibe los hold drag SVs. `posStyle` tiene rama Hold.
- **Commits** — `commitHoldZoom/Angle/Offset` usan `setSettings(prev => ...)` con
  actualización funcional, iterando sobre `active[]` con `baseOf(id) + defaultSettings`.
- **Toggle UI** — `HandIcon` SVG, visible con `active.length >= 2`, en `actionLeft`.
  Fondo dorado translúcido `rgba(190,150,80,0.18)` cuando activo.

## Decisiones importantes

**Why `holdMode || canManualRotate` en rotationGesture.enabled:**
La gesture se recrea en cada render; leer el estado React `holdMode` (no el SV)
da reactividad correcta en el setter de `enabled` sin riesgo de closure stale.

**Why commitHoldZoom multiplica por el factor de escala (no reemplaza):**
`e.scale` del gesto de pellizco es relativo al inicio del gesto (1.0=sin cambio);
hay que multiplicar el zoom previo de cada capa por ese factor. No se puede usar
`updateSetting` individual porque todos los IDs deben actualizarse en una sola
pasada atómica del setSettings funcional.

**Why los commits NO usan updateSetting:**
`updateSetting` actualiza un solo ID. Para Hold necesitamos una transición atómica
sobre todos los IDs activos, con read-modify-write correcto sobre el prev snapshot.

## Auto-desactivación
`useEffect(() => { if (active.length < 2 && holdMode) setHoldMode(false); }, ...)`

## Parpadeo al soltar (drop flicker) — fix base-congelada + ratio + reset diferido

**Síntoma:** al soltar un gesto Hold (drag/zoom/rot), la imagen saltaba un frame de
la posición inicial A a la confirmada B y luego se asentaba. Afectaba drag y zoom.

**Causa:** los `commitHold*` hacían `setSettings` (A→B) **y** reseteaban los gates
(`holdXActive=0`, deltas=0) de forma SÍNCRONA. El reset llega al hilo UI ANTES del
re-render con B, así que un frame se dibuja con el committed viejo (A) y delta ya 0.
El modo normal nunca parpadea porque su SV en vivo es ABSOLUTO (drag) o un RATIO
auto-corrector `live/safe` (zoom) que enmascara el swap A→B, y apaga su gate en un
useEffect keyed en el escalar committed (DESPUÉS del re-render).

**Fix (requiere AMBAS piezas — enmascarar Y diferir el reset):**
- **Enmascarar el swap durante la ventana de commit:**
  - drag/rotación: base CONGELADA (`holdBaseOffsetX/Y`, `holdBaseAngle`) capturada
    por `useAnimatedReaction` en la transición 0→1 del gate, con flag `*Frozen` que
    evita recongelar cuando el committed salta a B mid-transición. El worklet pinta
    `base + delta` (no `committed + delta`).
  - zoom: ratio auto-corrector `(holdBaseMag * holdScaleSV) / committedMag`. Cuando
    committedMag alcanza el objetivo, el ratio cae a 1 solo → `effectiveSize*ratio`
    invariante (committedMag DEBE estar en deps del useDerivedValue).
- **Diferir el reset del gate al re-render:** quitar los resets síncronos de los
  `commitHold*`; cada uno bumpea un contador useState; effects keyed en esos
  contadores (guard `=== 0`) apagan el gate DESPUÉS del re-render (cuando base+delta
  ya == B → apagar es invisible).

**Why ambas piezas:** solo diferir no basta (el modo normal enmascara además de
diferir); solo enmascarar tampoco (el gate quedaría encendido). El ratio de zoom es
robusto al orden exacto re-render vs reset; drag/rot dependen de que el effect corra
tras aplicar committed=B (garantizado: `setSettings` se llama antes del bump, batched
o no).

**Riesgos aceptados (no bloqueantes):**
- Orden de mappers en el INICIO del gesto: la reacción que congela la base se declara
  ANTES del consumidor (pinchScaleSV/aStyle/posStyle), pero Reanimated NO garantiza
  formalmente ese orden (la reaction no declara outputs). Peor caso = 1 frame de base
  stale al iniciar; en la práctica no se observa. Alternativa si molesta: capturar la
  base en el worklet `onStart` del gesto.
- Gesto cancelado (onEnd no dispara) en Hold: el gate queda en 1 hasta el próximo
  `onStart` (los `onFinalize` Hold son solo comentarios). NO es regresión (el código
  viejo también reseteaba solo dentro del commit de onEnd). Mejora futura: resetear
  gate+delta en `onFinalize` cuando no hubo éxito (patrón `rotSucceeded`).
