---
name: Hero image as one continuous background (no two-backgrounds seam)
description: How to blend a top hero/universe image into a full-height gradient background so they read as ONE background, with no visible seam
---

# Hero image + gradient background reading as "two backgrounds"

**Symptom:** A hero/banner image at the top of a screen and the content area below it read as two distinct backgrounds — a visible horizontal seam/band where the hero ends and the content gradient begins. Tuning the hero overlay's stops never fully fixes it.

**Root cause:** The hero is a *separate* layer that fades to a solid end color, but the screen background is a full-height `absoluteFill` LinearGradient that keeps changing color with Y. Fading the hero to a *guessed* solid color that must match the background at the hero's bottom Y is fragile — it's Y-position dependent (varies with `topPad`, screen height) and never matches exactly.

**Robust fix (current, best): put the image IN the root background layer and fade it to the EXACT root-gradient color at the overlay's bottom Y.**
In the single `absoluteFill` background layer, stack bottom→top:
1. Root gradient (THE one background), e.g. `["#4A0C0C","#27070E","#1B060F"]` locations `[0,0.5,1]`, full screen.
2. The hero image, `position:absolute, top:0, height:"50%"`, `contentFit:"cover"`.
3. A fade LinearGradient over the image (same `height:"50%"`) that ends at **exactly the root-gradient color at 50% screen** (`#27070E`). Because the overlay's bottom = the root color at that Y, and below the image the *same* root gradient continues, there is no seam — it's literally one continuous gradient.
4. `bgDim` (conditional) on top.

The content (title, tabs) lives in the normal content tree ON TOP of this bg layer, so it floats over the universe image.

**Top edge too:** to keep the universe from touching the very top (bg should extend down over it), add a top stop to the same fade overlay: start at the root top color opaque (`#4A0C0C` at location 0) → transparent (`rgba(74,12,12,0)`) by ~0.21. So the image is hidden at the very top, appears in a band, then fades back to `#27070E` at the bottom. Example overlay: colors `["#4A0C0C","rgba(74,12,12,0)","rgba(74,12,12,0)","rgba(60,10,13,0.45)","rgba(45,8,13,0.85)","#27070E"]` locations `[0,0.21,0.46,0.66,0.84,1]`.

**Failed approaches (don't repeat):**
- Hero as a separate banner layer fading to a solid guessed color → Y-dependent, always a faint seam.
- Ending the fade at `transparent` → RN renders transparent as black-ish banding.
- `marginBottom`/negative-margin bleed with an inner clip View → unreliable in Yoga when children are all absolutely positioned.
- Tweaking only the overlay rgba stops → never fixes a mismatch that is really with the *background*.

**Why not MaskedView:** would let the image dissolve into the live gradient, but `@react-native-masked-view/masked-view` isn't installed and it's overkill — ending the overlay at the exact root color is simpler and exact.

**How to apply:** Whenever a top image must blend into a screen with a full-height gradient background, don't make the hero its own background — move the image into the root bg layer and fade it to the root gradient's exact color at the image's bottom Y. Position px offsets (title nudges, "N px above title") via fractional `locations` tuned on the target device, since the overlay height is `"50%"`.
