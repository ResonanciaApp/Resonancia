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

## Microlag al DESLIZAR solo con tiles seleccionadas = sombra SVG sin shadowPath

Síntoma: scroll fluido sin selección; con ≥1 card seleccionada VISIBLE aparece microlag al
deslizar. Causa: el glifo de la tile seleccionada (glow>0) lleva `shadowColor/shadowRadius`
+ `shadowOpacity` animada sobre contenido SVG. Sin `shadowPath`, iOS deriva la sombra del
alpha del contenido → **pase OFFSCREEN por frame** al recomponer durante el scroll → frames
caídos. Sin seleccionar, glow=0 ⇒ sombra invisible ⇒ sin pase ⇒ fluido.

**Fix:** `shouldRasterizeIOS={isSelected || isActivating}` en el `Animated.View` que lleva la
sombra → cachea capa+sombra en bitmap y lo compone sin recalcular. Gatearlo (no siempre) para
no rasterizar las no seleccionadas (no tienen sombra; un scale 1.0 → cero blur) ni gastar
memoria con ~50 tiles. El 1.1 estático de la seleccionada NO pixela el bitmap (rasterizado a
contentsScale). Reanimated deja de escribir shadowOpacity al asentar el glow → cache estable.
**Regla general:** cualquier sombra sobre SVG/contenido complejo que se mueva en un scroll =
candidata a esta jank; preferir shouldRasterizeIOS o un HaloGlow (gradiente radial) sobre la
sombra derivada del alpha.

## No tocar: layout animations, reorder del DOM

Cualquier cambio que reintroduzca `LinearTransition`, reorder del array `active` en el momento del
drop, o modificación del DOM fuera del `domOrder` estable, causa carrera mapper-vs-layout →
parpadeo/flicker de 1 frame. Si aparece microlag, revisar primero:
1. `wrapStyle` tiene un solo `useAnimatedStyle` siempre montado (no toggle en el array).
2. `slotSV` lee directo de `orderSV.value.indexOf(id)` en el UI thread.
3. `useFrameCallback` del auto-scroll usa `scrollTo(ref, x, 0, false)` (sin animación nativa).
