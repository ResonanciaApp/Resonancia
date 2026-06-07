---
name: Geometrix zoom = render size, not transform
description: How magnification is applied to sacred-geometry layers so vectors stay crisp
---

Para escalar una capa de geometría (SVG vectorial), plegá la magnificación CONFIRMADA en el tamaño REAL de render del SVG, NO en un `transform: scale()`.

**Why:** un `transform: scale()` sobre el Animated.View que envuelve el SVG estira la capa ya rasterizada → el trazo engorda proporcional y se pixela. Redibujar el SVG al tamaño grande lo mantiene nítido a cualquier escala y, al recalcular el strokeWidth desde el tamaño efectivo, el grosor VISUAL queda constante.

**How to apply:**
- `effectiveSize = size * userScale * safeZoom` (magnificación confirmada) → pasar como `size` a SacredGlyph (las 3 copias: trazo + 2 capas de glow).
- `base1px = 100 / effectiveSize` (viewBox 0–100) → trazo visual constante.
- El `transform: scale` solo lleva términos dinámicos por frame: respiración + delta del pellizco EN VIVO (`liveZoom.value / safeCommittedZoom`, =1 en reposo y al soltar). El pinch en vivo sigue usando transform por fluidez (60fps); al soltar se confirma a settings y se redibuja nítido. El handoff es continuo (sin salto de frame).
