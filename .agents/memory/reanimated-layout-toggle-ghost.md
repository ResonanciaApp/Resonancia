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
- Dragged tile: follows the finger, but the transform is expressed RELATIVE to its DOM slot
  (see slot-relative section) so it reaches 0 in lockstep with the commit. It only writes
  shared `dragOriginIdx`/`dragTargetIdx` mid-drag; the array reorders ONCE on release.
- Siblings: read origin/target and open the gap with `translateX: withTiming(±itemW)`.
- The animated style (`wrapStyle`) must be ALWAYS attached — never toggled against a static
  style (see detached-animated-style section; that toggle is what caused the persistent
  ±itemW overlap-the-neighbor bug).
- Commit on release: `setDragSettling(true)` + `moveActiveTo` + `setDraggingId(null)` (see
  batching section — must be `unstable_batchedUpdates`, not React auto-batch). Net visual
  position is constant: DOM slot moves +Δ, transform drops -Δ in one render. `dragSettling`
  keeps `LinearTransition.duration(0)` for that one frame (cleared next rAF) so the reorder
  itself doesn't animate, AND drives the sibling settle-frame guard.

## Never toggle an animated style in/out of the style array (detach leaves stale transform)

`style={[base, anyDragging ? wrapStyle : styles.tileRest]}` looks like it cleanly resets the
transform when the drag ends. It does NOT. Detaching a `useAnimatedStyle` leaves its LAST
written transform stuck on the native node — Reanimated does not reset it on detach, and the
static `tileRest` does not override it. Result: every swapped tile keeps its last gap offset
(±itemW) and overlaps its neighbor PERSISTENTLY (not a 1-frame flash).

**Fix:** keep ONE `useAnimatedStyle` ALWAYS in the array (`style={[base, wrapStyle, ...]}`)
and express every state — drag, gap, AND rest (translateX 0) — inside the worklet. Add an
explicit deps array so it re-runs when the props it reads change.

**Diagnostic tell:** a PERSISTENT ±itemW overlap (each swapped card sits exactly one slot
past its target, over its neighbor) = detach-stale-transform. A ~CAROUSEL_FLOW_MS drift =
armed animation (see batching). A 1-frame flash = slot mismatch.

## Lockstep without a JS round-trip: read the slot PROP inside the worklet

The dragged tile must hit transform 0 in the EXACT render the DOM reorders it to `target`.
A shared value mirrored via `useEffect` (or `useAnimatedReaction`) lags one frame. Instead,
read the per-tile slot PROP (`indexInFront`) directly in the `useAnimatedStyle` worklet: the
worklet closure is re-created every render capturing the current prop value, so it updates in
lockstep with the DOM commit — no SV, no lag.

- Dragged tile: `translateX = dragX.value - (indexInFront - dragOriginIdx.value) * itemW`.
  During drag `indexInFront===origin` → `= dragX` (follows finger). At commit `indexInFront`
  becomes `target` and `dragX` has glided to `(target-origin)*itemW` → `= 0` exactly.
- Siblings: compute the gap from `indexInFront` (lockstep), not a lagging mirrored SV.
- Keep a mirrored SV (`idxSV`) ONLY for UI-thread contexts that can't read props (gesture
  `onStart`, `useAnimatedReaction`).

## Release-phase race (subtle, cost a review cycle to catch)

Keep the "this tile is dragging" flag (`selfDragging`) at 1 through the release glide AND
until AFTER the commit. Clear it (and dragX/origin/target) in a `useEffect` keyed on
`isDragging` going false — never in the `withTiming` completion callback.

**Why:** if you clear `selfDragging` in the UI-thread completion callback, there's a gap
before `runOnJS` commits where the tile already fell into the sibling-gap worklet branch,
which animates its translateX back toward 0 before the DOM reorders → micro-jump. Post-commit
the always-attached worklet already returns translateX 0 in the tile's final slot, so the
resets are visually inert.

## Release commit MUST be explicitly batched (not React auto-batch)

The release commit runs from a `withTiming` completion callback via `runOnJS`. React 18
auto-batching is NOT reliable in that context. If `moveActiveTo` + `setDraggingId(null)` +
`setDragSettling(true)` flush in separate renders, you get an intermediate render without
`dragSettling` but with `active` already reordered → an animated (non-instant)
gap/`LinearTransition` of `CAROUSEL_FLOW_MS` gets armed, and the two swapped tiles DRIFT
APART over ~1s leaving empty slots after the swap.

**Fix:** wrap all release state transitions in `unstable_batchedUpdates(() => { ... })`
(from `react-native`) so they land in ONE commit. Order: set `dragSettling(true)` first,
then `moveActiveTo`, then `setDraggingId(null)`.

## Settle-frame siblings must be translateX 0 BY CONSTRUCTION (not via the gap formula)

On the commit frame, `dragSettling===true` but `dragOriginIdx`/`dragTargetIdx` are NOT yet
reset to -1 (that happens in the post-commit `useEffect`), while `indexInFront` is ALREADY
the post-reorder slot. So the gap formula re-evaluated on that frame can still place a MIDDLE
sibling inside the gap range (e.g. origin 0 → target 2: the sibling now at final slot 1 still
matches `slot>origin && slot<=target`) → one-frame overlap before cleanup zeroes it.

**Fix:** in the worklet, immediately after the dragged-tile branch, add
`if (dragSettling) return { transform: [{ translateX: 0 }] }`. On the settle frame the DOM
has already placed every sibling in its final slot, so 0 is correct by construction — don't
re-derive it from origin/target/slot.

**Belt-and-suspenders:** also return `translateX: 0` IMMEDIATELY (plain, no `withTiming`)
when no drag is active (`dragOriginIdx < 0 || dragTargetIdx < 0`). A `withTiming(0)` at rest
means any stale release frame can animate a long tail; the instant return kills that drift.

**Diagnostic tell:** if the post-release artifact lasts ~`CAROUSEL_FLOW_MS` (vs a 1-frame
flash), the cause is an armed animation (batching/snapshot), not a slot mismatch.

## Still-true general rule about `layout={undefined}`

Never set `Animated.View layout={undefined}` to "pause" layout animation — it freezes the
last snapshot at the old slot and ghosts on re-enable. Keep layout always-on and make it
instant for the phase you don't want animated: `layout={LinearTransition.duration(instant ?
0 : NORMAL_MS).easing(EASE)}`.
