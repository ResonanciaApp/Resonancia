---
name: Hero image fade must match background at its Y, not at screen bottom
description: Why a faded hero/banner image shows a horizontal "cut" band over a full-height gradient background, and the robust fix
---

# Hero fade band / hard cut over a gradient background

**Symptom:** A hero/banner image at the top of a screen fades (via a LinearGradient overlay) into a solid end color, but a visible horizontal line/band appears where the image ends — the faded image looks darker (or lighter) than the area immediately below it.

**Root cause:** The screen's background is a full-height `absoluteFill` LinearGradient (e.g. `["#4A0C0C","#27070E","#1B060F"]` over `[0,0.5,1]`). The hero fades to the gradient's *final* color (`#1B060F`), but at the hero's *bottom Y* (~25-30% of screen height) the background gradient is still in an earlier, lighter/redder phase (~`#36090D`). Fade-end color ≠ background color at that Y → seam.

**Failed approaches (don't repeat):**
- Ending the hero overlay at `transparent` → RN renders transparent as black-ish banding.
- `marginBottom: -80` bleed trick with an inner clip View → unreliable in Yoga when the container's children are all absolutely positioned; the negative margin does not pull the next sibling up as expected, leaving a gap.
- Tweaking the hero overlay's rgba stops alone → never fixes it, because the mismatch is with the *background*, not the overlay.

**Robust fix:** Make the background gradient reach the hero's fade-end color *before* the hero's bottom edge and hold it to the bottom. Add a 4th stop:
`colors={["#4A0C0C","#27070E","#1B060F","#1B060F"]}` `locations={[0,0.11,0.20,1]}`.
The reddish phase (0→0.20) sits entirely behind the opaque hero image (invisible), and everything below the hero is solid `#1B060F` = exactly what the hero fades to. Device-independent (works regardless of `topPad`/screen height) and needs no MaskedView dependency.

**Why not MaskedView:** would let the image dissolve into the live gradient (preserving a varying background), but `@react-native-masked-view/masked-view` isn't installed here and it's overkill — matching the hold color is simpler and exact.

**How to apply:** Any time you fade a top image into a screen that has a full-height gradient background, set the background to reach the fade's end color by ~0.20 and hold it. Don't try to match by tuning the overlay.
