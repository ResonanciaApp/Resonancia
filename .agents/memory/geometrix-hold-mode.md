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
