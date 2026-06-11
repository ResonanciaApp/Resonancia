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

## ⚠️ REGLA CRÍTICA: NO usar transform en views que contienen SVGs dentro de un ScrollView

**Causa real confirmada del microlag con tiles seleccionadas:**

`transform: scale(N)` (N ≠ 1.0) en un `Animated.View` o `View` que contiene un SVG
(react-native-svg, SacredGlyph) dentro de un `ScrollView` crea un **isolated
compositing context** en iOS. Cada frame de scroll, iOS:
1. Renderiza el SVG en un buffer separado (offscreen)
2. Aplica el transform al buffer
3. Compone ese buffer en el scroll content layer

Para N=1.0 (identity), iOS puede omitir el isolated context → sin pase extra.
Para N=1.1, iOS siempre crea el buffer → un pase extra por tile seleccionada por frame.

**Consecuencia:** microlag que se suaviza al pasar por tiles NO seleccionadas. Solo ocurre
durante el scroll (el buffer se recrea por frame que el layer se mueve).

**NUNCA** aplicar `transform: scale(N ≠ 1)` sobre un `View`/`Animated.View` que contiene
SVGs (SacredGlyph, react-native-svg) dentro de un ScrollView. Para indicar "tamaño mayor"
en SVGs seleccionados:
- Cambiar el prop `size` del SVG directamente (sin wrapper de transform)
- O usar `useAnimatedProps` para animar `width`/`height` del `<Svg>` directamente
- Nunca usar `useAnimatedStyle(() => ({ transform: [{ scale: ... }] }))` en un wrapper de SVG

Esta regla aplica también a:
- `haloStyle` con `opacity < 1` en un wrapper que contiene SVG → offscreen compositing pass
- Cualquier `Animated.View` con opacity < 1 + sublayers dentro de ScrollView

## Historial de fixes (cronológico)

1. **Sombra → halo SVG:** `shadowOpacity` sin `shadowPath` recalcula el alpha mask por frame → reemplazado por halo `RadialGradient`. Pero el `Animated.View` del halo con `opacity:0.66` también generaba un offscreen pass → eliminado.

2. **shouldRasterizeIOS (insuficiente):** intentado en múltiples combinaciones. El problema real no era rasterización sino el isolated compositing context del transform. `shouldRasterizeIOS` + `setNativeProps` de Reanimated (worklet loop) invalidaba el bitmap. No sirve cuando hay animated styles en el subtree.

3. **Transform scale del glifo (causa raíz confirmada):** `Animated.View` con `glyphStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))` para tiles seleccionadas (scale=1.1) creaba el isolated compositing context. Confirmado: al eliminar el `Animated.View` wrapper y el `scale` SharedValue, el microlag desapareció.

**Fix actual:** SacredGlyph directo dentro del `View tileGlyph`, sin ningún wrapper de transform. Selección indicada por color del glifo + borde + fondo de la card.

**Para restaurar animación de selección sin microlag:** animar el prop `size` del SVG
con `useAnimatedProps` (cambia el viewport del SVG, no el transform del wrapper).

## Microlag al SELECCIONAR (distinto del scroll) = capas pesadas re-reconciliando

Fix: `React.memo` en `CanvasLayer` + `getStableSettings(id)`. **No reintroducir**
`getSettings(iid)` (objeto fresco) en el render del lienzo — anula el memo.

## No tocar: layout animations, reorder del DOM

1. `wrapStyle` tiene un solo `useAnimatedStyle` siempre montado.
2. `slotSV` lee directo de `orderSV.value.indexOf(id)` en el UI thread.
3. `useFrameCallback` del auto-scroll usa `scrollTo(ref, x, 0, false)`.
