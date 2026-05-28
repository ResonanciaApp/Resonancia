---
name: SacredBackground gradient matching
description: When fading a hero image into a screen that uses SacredBackground, the gradient must end in a very dark color (~#0F0A06), not the root warm bg.
---

When a screen uses `<SacredBackground />`, the effective visible color underneath the ScrollView is **much darker** than the root `backgroundColor` because `SacredBackground` paints `rgba(8,4,2,0.72)` over the bg texture, plus a vignette.

**Rule:** Hero image overlay gradients on these screens must fade to roughly `#0F0A06` (very dark warm brown, near black), not to `colors.background` / `#2A1D14` / `#18110C`. Fading to the root bg color creates a visible seam where the hero ends and SacredBackground begins.

**Why:** Bitten twice — first on the player (solved by removing SacredBackground), then on `tag/[id].tsx` where a visible band appeared between the green hero image and the body. Fading to `#0F0A06` with stops like `[0, 0.5, 0.88, 1]` and opacities `[0, 0.35, 0.9, 1]` blends seamlessly.

**How to apply:** Any new screen that pairs a top hero image with `<SacredBackground />` underneath, use:
```ts
colors={["rgba(15,10,6,0)", "rgba(15,10,6,0.35)", "rgba(15,10,6,0.9)", "#0F0A06"]}
locations={[0, 0.5, 0.88, 1]}
```
Alternative if matching is too fiddly: remove SacredBackground from that screen and use a solid bg matching the hero's gradient end.
