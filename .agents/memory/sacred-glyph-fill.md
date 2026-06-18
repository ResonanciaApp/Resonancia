---
name: SacredGlyph box-fill sizing
description: How to size SacredGlyph so it visually fills a (possibly non-square) cover box like a photo
---

SacredGlyph renders an SVG (viewBox 0–100) into a `size×size` view; SvgXml fills it 100%. The drawn geometry is **normalized to extent ~39** (radius 39 from center 50,50) via a `translate+scale` baked INTO each string in `data/glyph-strings.ts`. So visible content diameter ≈ **0.78 × size** for every glyph.

The `EXTENT` / `TARGET_EXTENT` maps in `SacredGlyph.tsx` are **metadata only — NOT used at render** (and can be stale, e.g. flor-vida listed 36 but really draws to 39). Do not size based on them.

**Rule to fully cover a cover box (no gold-tint corners showing, photo-like):** the content diameter must exceed the box **diagonal**, not just its width.
- `size = sqrt(W² + H²) / 0.78`
- Example: 70×62 box → diagonal 93.5 → size ≈ 120. (size=90 only matched the 70px width → circle touched left/right but left all 4 corners empty and looked "small/floating".)
- For a square box of side S: diagonal = S·1.414 → `size = S·1.81` for full coverage; `S·1.28` only inscribes the circle (corners show tint).

**Why:** user repeatedly reported playlist geometrix thumbnails "se ven chicas" through several size bumps (62→80→90). The bumps were near the width-fill point, so corners stayed empty and it kept reading as small. Covering the diagonal is what makes it read as full.

**How to apply:** when a glyph must look like a filled cover, oversize to diagonal coverage and rely on `overflow:"hidden"` on the container to crop. Accept that the outer ring gets cropped (especially top/bottom on short boxes) — that's the intended photo-like look. Container needs `overflow:"hidden"` + centered. Expo app renders blank on web, so screenshots can't verify mobile UI — reason from geometry instead.
