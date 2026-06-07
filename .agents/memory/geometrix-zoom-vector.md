---
name: Geometrix zoom = render size, not transform
description: How magnification is applied to sacred-geometry layers so vectors stay crisp
---

Para escalar una capa de geometría (SVG vectorial), plegá la magnificación CONFIRMADA en el tamaño REAL de render del SVG, NO en un `transform: scale()`.

**Why:** un `transform: scale()` sobre el Animated.View que envuelve el SVG estira la capa ya rasterizada → el trazo engorda proporcional y se pixela. Redibujar el SVG al tamaño grande lo mantiene nítido a cualquier escala y, al recalcular el strokeWidth desde el tamaño efectivo, el grosor VISUAL queda constante.

El zoom NUNCA va en transform — ni el confirmado ni el del pellizco EN VIVO. Todo el zoom se aplica redibujando el SVG a su tamaño real.

**Why (extra, pellizco en vivo):** mezclar transform-en-vivo + redibujo-al-soltar provoca un parpadeo/fantasma: al soltar, el delta de transform vuelve a 1 y el SVG se re-rasteriza al tamaño nuevo en frames distintos (carrera no sincronizable) → se ve un frame con la geometría chica detrás y un "se comporta como antes" suave por unos ms. Sin transform no hay traspaso que sincronizar.

**How to apply:**
- `effectiveSize = size * userScale * effZoom` → pasar como `size` a SacredGlyph (las 3 copias: trazo + 2 capas de glow). `effZoom` = el pellizco EN VIVO (número por prop `liveZoom`, redibuja en tiempo real) cuando existe, si no `safeZoom` (confirmado en settings).
- `base1px = 100 / effectiveSize` (viewBox 0–100) → trazo visual constante a cualquier zoom (en vivo y confirmado).
- El `transform: scale` SOLO lleva respiración (+ rotación). NUNCA zoom.
- Pinch: `onUpdate` → `runOnJS(setLivePinchNum)(z)` (redibuja el objetivo cada frame). `onEnd` → commit a settings (solo éxito). `onFinalize` → `setLivePinchNum(null)` SIEMPRE (también al cancelar) y después del commit → el objetivo pasa del en-vivo al confirmado (mismo valor) sin frame intermedio, y un gesto cancelado no queda pegado al en-vivo.
- `SacredGlyph` va en `React.memo`: durante el pellizco solo re-renderiza el objetivo (las otras capas conservan props idénticas y no reconstruyen su árbol).
