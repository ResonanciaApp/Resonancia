---
name: RN overlay effect gotchas
description: Touch-target (hitSlop) clipping and resting-state pitfalls when layering glow/wave effects behind a Pressable in React Native
---

# RN overlay effect gotchas

Lessons from building the Geometrix header audio button (glow + expanding-wave behind a Pressable).

## hitSlop is clipped to the direct parent's bounds
`hitSlop` on a Pressable does NOT extend the touch target past the bounds of its **direct parent**. If you wrap a button in a container that is exactly the button's size, `hitSlop` buys you nothing — the effective touch area stays the button size.

**How to apply:** when you wrap a pressable (e.g. to stack absolute glow/wave overlays behind it), make the wrapper noticeably larger than the button (and center the button), so the hitSlop has room to expand into. A wrap equal to the button size silently shrinks the touch target.

## Sibling overlap can steal taps even without a responder
A sibling laid out with negative margin (e.g. a carousel `marginTop:-25`) can visually overlap a header and intercept/cover the lower half of a button, so taps land "above" the icon only. Fix by giving the element that should win a higher `zIndex` (siblings in the same parent). Plain Views without touch responders don't claim the touch, but stacking/paint order still matters for what the user perceives as tappable.

**Why:** the real bug felt like a bad hitSlop but was paint/stacking order.

## One-shot expanding-ring resting value
For a one-shot "onda expansiva" ring whose opacity is `(1 - value) * k` and scale grows with `value`, the **resting** shared value must be `1` (→ opacity 0 = invisible), not `0`. Initialize `useSharedValue(1)` and reset to `1` (not `0`) when stopping. On play: set to `0` then `withTiming(1)`. Starting/resting at `0` leaves the ring permanently visible at `k` opacity at mount and after every stop.

## Glow halo: ring + shadow, not a solid disc
A solid-color disc placed behind a button with a transparent face shows through and tints the icon center. For a glow that does NOT fill the center: use a **ring** (transparent center, colored border) plus a same-color `shadow*` (shadowColor/shadowRadius/shadowOpacity) that spills outward as the glow. Animate the wrapper opacity for the breathing pulse. (iOS shadow only; Android shows the ring without colored glow — acceptable fallback.) Ensure no ancestor has `overflow:"hidden"` or the shadow is clipped.
