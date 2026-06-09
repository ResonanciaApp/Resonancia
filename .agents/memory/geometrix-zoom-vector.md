---
name: Geometrix zoom = render size, not transform
description: How magnification is applied to sacred-geometry layers so vectors stay crisp (committed AND live pinch)
---

Para escalar una capa de geometría (SVG vectorial), la magnificación se pliega en el tamaño REAL de render del SVG (`width`/`height`), NO en un `transform: scale()`. Esto vale tanto para el zoom CONFIRMADO como para el pellizco EN VIVO.

**Why:** un `transform: scale()` sobre el SVG (o el Animated.View que lo envuelve) estira la capa ya rasterizada → el trazo engorda proporcional y se pixela/parpadea. Redibujar el SVG al tamaño grande lo mantiene nítido; al recalcular/compensar strokeWidth el grosor VISUAL queda constante.

**Zoom CONFIRMADO:** `effectiveSize = size * userScale * safeZoom` (estable entre renders); `base1px = 100 / effectiveSize` → trazo visual constante. El SVG se dibuja a `effectiveSize`.

**Pellizco EN VIVO (UI thread, sin transform y sin runOnJS por frame):**
- `SacredGlyph` acepta `liveScaleSV?: SharedValue<number>`. Cuando se pasa, usa `AnimatedSvg`/`AnimatedG` (`Animated.createAnimatedComponent`) con `useAnimatedProps`: el SVG redibuja a `size * liveScaleSV.value` y el `<G>` compensa el trazo a `strokeWidth / liveScaleSV.value` → grosor VISUAL constante, trazo NÍTIDO (no transform), sin re-render de React.
- En `GeometryLayer`, `pinchScaleSV = useDerivedValue(() => liveZoomSV.value / safeZoom, [safeZoom])` (ratio auto-correctivo). Solo el objetivo del pellizco recibe `liveZoomSV` (= `livePinch` del padre); el resto recibe `undefined` → camino ESTÁTICO (Svg/G normales, sin overhead de animatedProps). Esto es clave para perf: miniaturas y capas no seleccionadas nunca pagan animatedProps.
- `aStyle` (useAnimatedStyle) ya NO lleva `pinchScale`: solo `rotate` + `breatheScale`. El zoom vive en `liveScaleSV` (tamaño), no en transform.

**Ratio auto-correctivo evita el fantasma al soltar:** al confirmar (`onEnd` → `commitZoom`), React re-renderiza con `safeZoom = livePinch.value`; el closure de `pinchScaleSV` se actualiza → `liveZoomSV/safeZoom → 1` y `effectiveSize` crece al valor confirmado → tamaño visual idéntico, sin salto, sin runOnJS por frame.

**Gate `pinchActive` evita el "pop" gigante al cambiar de selección/objetivo (issue real):**
`livePinch.value` se sincroniza al zoom del nuevo objetivo en un `useEffect` que corre DESPUÉS del render. En ese hueco `livePinch` trae el valor del objetivo ANTERIOR → `liveZoomSV/safeZoom` da un ratio enorme por un microsegundo → la geometría explota y vuelve. Fix: un SharedValue `pinchActive` (1/0). `pinchScaleSV` devuelve 1 si `pinchActive.value === 0`. Se pone 1 en el `onStart` del pinch y se vuelve 0 en el mismo `useEffect` de sincronización (tras el commit o cambio de objetivo). Así el escalado en vivo solo aplica mientras hay pellizco real en curso; en reposo/selección la capa muestra su `effectiveSize` confirmado.

**Trazo fino decorativo (líneas con strokeWidth explícito) — RESUELTO:** la contra-escala del `<G>` principal solo cubre hijos que HEREDAN strokeWidth. Algunos glifos tienen líneas conectoras con `strokeWidth={sw * 0.5}` (o `0.55`) EXPLÍCITO → no heredaban, así que engrosaban en el pellizco. Era MUY visible en `metatron` (es casi todo líneas); apenas perceptible en `merkaba`/`arbol-vida`/`metatron-expandido`. Fix general: `glyphElements` recibe un 3er arg `half?: HalfStroke` y envuelve esas líneas (sin strokeWidth propio) en un grupo `wrapHalf(children, factor, strokeOpacity, key)`. En modo pellizco el grupo es un `AnimatedG` con `gHalf50AnimProps`/`gHalf55AnimProps` (= `sw*factor / liveScaleSV`) → se contra-escala igual que el resto; en reposo/miniatura/patrón (`half` undefined o `G` estático) usa `<G strokeWidth={sw*factor}>` → render idéntico al anterior. **Why:** no hay "stroke-only scale" en SVG; `vectorEffect="non-scaling-stroke"` tiene soporte irregular en react-native-svg. **How to apply:** cualquier glifo NUEVO con líneas de trazo distinto al principal debe agruparlas con `wrapHalf` (no fijar strokeWidth por línea) o volverá a engrosar en el pellizco. El tipo de componente (`G`↔`AnimatedG`) es estable por instancia (canvas siempre live, miniaturas siempre estáticas) → sin remount/flash.

**How to apply (resumen):**
- SVG se dibuja a su tamaño real; el zoom NUNCA es `transform: scale`.
- Live target: `liveScaleSV` → useAnimatedProps en SacredGlyph (size + counter-stroke). No-target: estático.
- `pinchScaleSV` gateado por `pinchActive` (1 en onStart, 0 en el useEffect de sync) y dep en `[safeZoom]`.
- Pinch: `onUpdate` → solo `livePinch.value = z` (UI puro). `onEnd` → `runOnJS(commitZoom)`. `SacredGlyph` en `React.memo`.

**Misma regla en el carrusel de cards:** el "lift" al arrastrar NO debe ser `transform: scale` — pixela el SVG rasterizado. Usar `translateY` como afordancia de "levantar".

**DRAG y ROTATE comparten el mismo patrón de SharedValue gateado (NO reintroducir runOnJS por frame):** el micro-lag al arrastrar/rotar era idéntico al del zoom: ambos gestos escribían el SharedValue en el UI thread (`liveDragX/Y`, `liveRot`) PERO además llamaban `runOnJS(setLiveDragPos)`/`runOnJS(setLiveRotNum)` POR FRAME → re-render de TODO el lienzo cada frame. Fix = mismo molde que `pinchActive`/`livePinch`:
- Gates `dragActive`/`rotActive` (SharedValue 1/0): se ponen 1 en `onStart`; en ÉXITO siguen 1 hasta que el `useEffect` de sync (dep en `getSettings`, que cambia identidad en cada commit por `useCallback([settings])`) los apaga tras el commit; en CANCELACIÓN se revierte el live SV a la baseline y se apaga el gate en `onFinalize` (drag usa el 2º arg `success`; rotación usa su flag `rotSucceeded`).
- La capa del lienzo se envuelve en un componente module-level `CanvasLayer` cuyo `useAnimatedStyle` traslada por `liveDragX/Y` cuando `isTarget && dragActive==1`, si no por `committedX/Y`. El ángulo en vivo entra como `liveAngleSV: SharedValue` + `rotActiveSV` a `GeometryLayer` (rama `rotate` de `aStyle` lee `liveAngleSV.value` solo si `rotActiveSV.value===1`).
- Guías de snap: de `View`s condicionales por estado React a dos `Animated.View` SIEMPRE montadas, manejadas por `snapXSV/snapXOn`/`snapYSV/snapYOn` en `useAnimatedStyle` (opacity = on/off, translate = `canvasSide/2 + snapSV`); `onUpdate` solo escribe esos SV, `onFinalize` las apaga.
**Why no hay "pop" al confirmar:** al commitear, `committedX/Y` (y `committedAngle`) quedan EXACTAMENTE iguales a `liveDragX/Y`/`liveRot` (es lo que escribió `commitOffset`/`commitAngle`), así que durante la ventana en que el gate sigue 1 ambas ramas del worklet producen el MISMO transform → apagar el gate después no salta.
