---
name: Reanimated drag-to-reorder without ghost flash
description: Why live mid-drag DOM reorder always ghosts on release, and the pin-the-dragged-tile model that fixes it
---

## Decision: don't reorder the dragged item in the DOM during the drag

In a Reanimated drag-to-reorder list, the durable fix for one-frame ghost/jump artifacts
is to PIN the dragged item: it stays in its origin DOM slot and follows the finger via a
transform; only siblings shift (animated ±itemW gap offset); the real array reorder commits
ONCE on release.

**Why:** any model that reorders the dragged item LIVE while a transform follows the finger
fights an unavoidable 1-frame mismatch — the transform runs on the UI thread but the DOM
reorder is a JS round-trip (`runOnJS(setActive)`) that commits a frame or two later. Every
compensation scheme against that gap (predicted slot, or even mirrored rendered-slot SV +
useAnimatedReaction) only narrows the window; it never closes it, and the leftover shows as
a right-then-snap-left jump mid-drag and an origin-slot ghost flash on release.

**How to apply (the model that worked in Geometrix carousel):**
- Dragged tile: `dragX = pure effective finger translation` (no slot compensation, its DOM
  slot never moves mid-drag). It only writes shared `dragOriginIdx`/`dragTargetIdx`.
- Siblings: read origin/target and open the gap with `translateX: withTiming(±itemW)`.
- A render-level style switch (`anyDragging ? wrapStyle : styles.tileRest`) — NOT a worklet
  branch — so the transform→0 reset lands in the SAME render as the DOM reorder.
- Commit on release batches (React 18 auto-batch): `moveActiveTo` + `setDraggingId(null)` +
  `setDragSettling(true)`. Net visual position is constant: DOM slot moves +Δ, transform
  drops -Δ in one render. `dragSettling` keeps `LinearTransition.duration(0)` for that one
  frame (cleared next rAF) so the reorder itself doesn't animate.

## Release-phase race (subtle, cost a review cycle to catch)

Keep the "this tile is dragging" flag (`selfDragging`) at 1 through the release glide AND
until AFTER the commit. Clear it (and dragX/origin/target) in a `useEffect` keyed on
`isDragging` going false — never in the `withTiming` completion callback.

**Why:** if you clear `selfDragging` in the UI-thread completion callback, there's a gap
before `runOnJS` commits where `anyDragging` is still true but the tile already fell into
the sibling-gap style branch, which animates its translateX back toward 0 before the DOM
reorders → micro-jump. Post-commit `isDragging===false` means the tile is already on
`tileRest`, so the resets are visually inert.

## Release commit MUST be explicitly batched (not React auto-batch)

The release commit runs from a `withTiming` completion callback via `runOnJS`. React 18
auto-batching is NOT reliable in that context. If `moveActiveTo` + `setDraggingId(null)` +
`setDragSettling(true)` flush in separate renders, you get an intermediate render where
`anyDragging` is still true AND `active` is already reordered → an animated (non-instant)
gap/`LinearTransition` of `CAROUSEL_FLOW_MS` gets armed, and the two swapped tiles DRIFT
APART over ~1s leaving empty slots after the swap.

**Fix:** wrap all release state transitions in `unstable_batchedUpdates(() => { ... })`
(from `react-native`) so they land in ONE commit. Order: set `dragSettling(true)` first,
then `moveActiveTo`, then `setDraggingId(null)`.

**Belt-and-suspenders:** in the sibling-gap worklet, when no drag is active
(`dragOriginIdx < 0 || dragTargetIdx < 0`) return `translateX: 0` IMMEDIATELY (plain, no
`withTiming`). A `withTiming(0, CAROUSEL_FLOW_MS)` at rest means any stale release frame can
still animate a long tail; the instant return kills that class of drift entirely.

**Diagnostic tell:** if the post-release artifact lasts ~`CAROUSEL_FLOW_MS` (vs a 1-frame
flash), the cause is an armed animation (batching/snapshot), not a slot mismatch.

## Still-true general rule about `layout={undefined}`

Never set `Animated.View layout={undefined}` to "pause" layout animation — it freezes the
last snapshot at the old slot and ghosts on re-enable. Keep layout always-on and make it
instant for the phase you don't want animated: `layout={LinearTransition.duration(instant ?
0 : NORMAL_MS).easing(EASE)}`.
