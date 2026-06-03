---
name: SacredBackground solid-by-default + per-category color identity
description: Backgrounds are now flat/solid (Calm style). SacredBackground defaults to solid and renders null without solidColor, letting each screen's own root backgroundColor show.
---

## Solid backgrounds (current model)

The app uses **flat solid backgrounds** (no texture/degradado), Calm/Pura Mente style. `SacredBackground` defaults to `variant="solid"`; in solid mode with no `solidColor` it **returns null** and the screen's own root `backgroundColor` shows through.

**Why:** User explicitly wanted to remove the textured/gradient look and use solid fills, while **preserving each category's color identity**. Returning null (instead of filling a fixed color) lets every screen keep its intended root color in one global switch — neutral screens are `#18110C`, category screens keep their own dark tinted roots.

**Per-category background colors (identity — do NOT flatten to one global color):**
- Sonidos Ancestrales (bronce): root `#140D06`
- Meditaciones Guiadas (violeta): full-bg flat `LinearGradient ["#120C17","#120C17"]`, root `#060208`
- Música y Sonidos (verde): full-bg flat `LinearGradient ["#0E140A","#0E140A"]`, root `#060905`
- PodCast (azul): full-bg flat `LinearGradient ["#080C13","#080C13"]`, root `#04060B`
- Detalle de sesión (`session/[id]`) y player: `darkenHex(category.gradient[1], 0.6)` — versión oscurecida del color completo de la categoría (ya sólido, no usan SacredBackground).
- Neutras (Inicio, Biblioteca, perfil, comunidad, etc.): `#18110C`.

**How to apply:** New screens just set a solid root `backgroundColor` (neutral `#18110C` or the category tone) and optionally render `<SacredBackground />` (now a no-op unless `solidColor`/`variant="texture"` passed). Category context screens should use their category tone, not the global neutral.

## Legacy texture hero-fade rule (only if variant="texture")

The old textured variant painted `rgba(8,4,2,0.72)` over a texture, making the visible color much darker than root. If you ever reintroduce `variant="texture"`, hero image overlays must fade to ~`#0F0A06` (not the warm root) or a visible seam appears:
```ts
colors={["rgba(15,10,6,0)", "rgba(15,10,6,0.35)", "rgba(15,10,6,0.9)", "#0F0A06"]}
locations={[0, 0.5, 0.88, 1]}
```
With solid backgrounds this is mostly moot — match the hero fade to the screen's solid tone instead.
