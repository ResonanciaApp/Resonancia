---
name: Geometrix carousel — microlag prevention
description: Parámetros y reglas del carrusel de geometrías que eliminan microlag en el FLIP + animación
---

# Geometrix — Carrusel de geometrías: sin microlag

## Parámetros fijos (NO cambiar sin justificar)

| Parámetro | Valor | Por qué |
|---|---|---|
| `CAROUSEL_HOLD_MS` | 1000 | Duración del "hold" en el lugar antes de deslizar al frente |
| `CAROUSEL_FLOW_MS` | 1100 | Duración del deslizamiento al nuevo slot (FLIP) |
| `CAROUSEL_EASE` | `Easing.bezier(0.25, 0.1, 0.25, 1)` | Curva suave: inicio lento, medio rápido, fin desacelerado |
| `gap timing` (hueco de arrastre) | 180ms + `Easing.out(Easing.cubic)` | Respuesta rápida al cambio de destino: hermanas abren/cierran el hueco sin quedarse atrás del dedo |
| Activación scale | 500ms + 500ms (secuencia) | Pulso en el lugar: 1.0 → 1.18 → 1.1 |
| Activación glow | 500ms + 500ms (secuencia) | 0 → 1 → 0.66 |
| Title fade-in | 900ms | Aparece al unísono de la activación |
| Title fade-out | 320ms (tras PARK+150ms) | Se desvanece tras el deslizamiento |

## Regla: orden derivado + DOM estable = sin microlag

**Por qué el carrusel es fluido:** El modelo FLIP (DOM estable, solo transform) elimina el reflow de
Fabric. La única fuente de microlag que quedaba era el **gap de 180ms** para el hueco de arrastre:
con `CAROUSEL_FLOW_MS` (1100ms) las hermanas se quedaban atrás del dedo, y con 180ms + `Easing.out`
se adelantan rápidamente y desaceleran suavemente al destino. No bajar de 180ms: el ojo percibe el
corrimiento como un "snap" duro.

## El sistema de tema claro/oscuro metió microlag GENERAL en Geometrix → revertido entero

Se construyó un tema claro/oscuro para Geometrix (isLight/isLightSV leído en worklets de
render por frame, sustitución de color por glifo con `lightGeoColor`, `displayPalette`
filtrado, boost de saturación +0.25, opacidad forzada, gradientes de fondo). Aun con el toggle
desactivado (isLight=false hardcodeado) el microlag persistía EN GENERAL (no solo al deslizar
con cards seleccionadas). Intento previo de paliarlo con `shouldRasterizeIOS` en la sombra del
glifo NO alcanzó. **El usuario pidió borrar TODO el tema**: se revirtieron `geometrix.tsx`,
`data/geometries.ts` y `data/geometrix-creations.ts` al baseline pre-tema (commit "Improve
carousel performance by fixing lag") y se borró el stray `geometrix.backup.tsx`. El fix de
shouldRasterizeIOS se fue con ese revert (no quedó en el baseline limpio).

**Lección:** NO reintroducir lectura de tema (isLightSV) ni sustitución de color en los
worklets/render del lienzo de Geometrix — costo por frame = microlag general. Si se necesita
tema, hacerlo fuera del hot path de animación.

## Microlag al SELECCIONAR (distinto del FLIP) = capas pesadas re-reconciliando

Síntoma: al tocar un tile para activarlo, la animación de pulso/glow del tile
arranca con un pequeño retraso (microlag). NO es el FLIP ni el gap de arrastre.

Causa: `setActivatingIds`/`setActive` re-renderean el componente raíz; el pulso
del tile vive en un `useEffect` que arranca DESPUÉS de que ese render commitea.
Si el render es lento, la animación arranca tarde. Las `CanvasLayer`/`GeometryLayer`
del lienzo (y la tira de miniaturas) son pesadas (varios SharedValues, worklets,
efectos), y se re-reconciliaban TODAS en cada selección.

Fix: `React.memo` en `CanvasLayer` y `GeometryLayer` + **identidad estable del
objeto `settings`** vía `getStableSettings(id)` (cache `useRef<Map>` que devuelve
el MISMO merge mientras `settings[id]` no cambie de referencia; `updateSetting`
hace spread de `prev`, así solo la capa tocada recibe objeto nuevo). Sin el
settings estable, `React.memo` es inútil (el `getSettings()` viejo creaba un
objeto fresco por render → siempre re-render). Usar `getStableSettings` en el
render del lienzo y en la tira de miniaturas; el panel modal (~5536) sigue en
`getSettings` (esa capa SÍ debe re-renderear). Beneficio doble: también el drag
de un slider de sensibilidad solo re-renderea la capa tocada (no las N capas).

**No reintroducir** `getSettings(iid)` (objeto fresco) en el render del lienzo:
anula el `React.memo` y vuelve el microlag. Las props de `CanvasLayer` deben
seguir siendo SharedValues (refs), primitivos o el settings estable — nada
mutado in-place (rompería el shallow-compare del memo).

## Microlag al SCROLLEAR con cards SELECCIONADAS = sombra iOS por frame → halo gradiente → shouldRasterizeIOS → QUITAR shouldRasterizeIOS

### Historia de fixes (en orden cronológico):

**Fix 1 — sombra:** el glifo seleccionado tenía `shadowOpacity: 0.66` sin `shadowPath`
sobre un SVG → iOS recalcula la sombra alpha-mask CADA frame de scroll → microlag.
Fix: reemplazar sombra por halo de `RadialGradient` Svg cuya opacidad anima en el UI thread.

**Fix 2 — shouldRasterizeIOS nested (insuficiente):** se agregó `shouldRasterizeIOS` al
Pressable + a los Animated.View internos (halo y glifo). El anidamiento creaba 3 texturas
GPU separadas por tile → triple pasada de composición durante deceleration → drop de frames.

**Fix 3 — shouldRasterizeIOS solo en Pressable (insuficiente):** se quitó de halo y glifo,
dejándolo solo en el Pressable. Mejor, pero persistía.

**Fix 4 — CAUSA REAL → quitar shouldRasterizeIOS totalmente:**

Reanimated evalúa `haloStyle`/`glyphStyle`/`titleStyle` cada frame desde su worklet loop
(incluso con valores estables como glow=0.66, scale=1.1). Cada evaluación llama
`setNativeProps` en los sublayers del Pressable. En iOS, cualquier `setNativeProps`
sobre un sublayer de un CALayer con `shouldRasterize=true` **invalida el bitmap cacheado →
re-rasteriza ese frame → SVG RadialGradient + geometría = caro**.

**El fix correcto:** quitar `shouldRasterizeIOS` del Pressable (mantener
`renderToHardwareTextureAndroid` que no tiene este problema en Android). Sin cache de
rasterización, los `setNativeProps` de Reanimated son updates normales de CALayer,
manejados por el GPU sin overhead de cache-invalidation.

**Regla:** NO usar `shouldRasterizeIOS` en ningún view que contenga (o esté dentro de)
`useAnimatedStyle` views — Reanimated invalida el cache en cada evaluación de worklet,
incluso para valores estables. Usar `renderToHardwareTextureAndroid` solo en Android.

## No tocar: layout animations, reorder del DOM

Cualquier cambio que reintroduzca `LinearTransition`, reorder del array `active` en el momento del
drop, o modificación del DOM fuera del `domOrder` estable, causa carrera mapper-vs-layout →
parpadeo/flicker de 1 frame. Si aparece microlag, revisar primero:
1. `wrapStyle` tiene un solo `useAnimatedStyle` siempre montado (no toggle en el array).
2. `slotSV` lee directo de `orderSV.value.indexOf(id)` en el UI thread.
3. `useFrameCallback` del auto-scroll usa `scrollTo(ref, x, 0, false)` (sin animación nativa).
