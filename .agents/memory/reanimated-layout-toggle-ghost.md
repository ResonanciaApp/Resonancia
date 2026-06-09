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
- Dragged tile: follows the finger with PURE `dragX` (no slot-relative math — that caused a
  revert regression; see the dragSettling-FIRST section). Its DOM slot stays at origin until
  commit, so pure finger-follow lands correctly; on the commit frame the dragSettling guard
  zeroes it. It only writes shared `dragOriginIdx`/`dragTargetIdx` mid-drag; array reorders
  ONCE on release.
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

## Commit frame: zero the DRAGGED tile too, via a `dragSettling`-FIRST guard

The dragged tile must hit transform 0 in the render the DOM reorders it to `target`. Do NOT
make its rest/commit position a slot-relative formula
(`dragX - (indexInFront - origin) * itemW`). That formula looks correct at the ideal commit
frame, but it is RACY: `indexInFront` is a prop that flips to `target` in lockstep with the
DOM, while `origin`/`selfDragging`/`dragX` are shared values reset asynchronously by the
post-commit cleanup `useEffect`. When they desync (e.g. `indexInFront=target`, `origin` still
real, `dragX` already 0), the formula evaluates to ≈`-itemW` and SHOVES each swapped card
back toward its original slot → the two cards visibly "re-swap" back to where they started.

**Fix (the model that worked):** in the worklet, check `dragSettling` FIRST — before the
`selfDragging` branch. On the commit frame the DOM has already placed EVERY tile (the dragged
one included) in its final slot, so return `translateX: 0` for all. `dragSettling` is set true
in the SAME batch as the reorder, so it covers exactly that window. Then:
- Dragged tile (glide included): plain `translateX: dragX.value` — its DOM slot doesn't move
  until commit, so pure finger-follow is correct; no slot compensation needed.
- Siblings: compute the gap from the slot PROP `indexInFront` (re-captured each render →
  lockstep with the DOM), not a lagging mirrored SV.
- Keep a mirrored SV (`idxSV`) ONLY for UI-thread contexts that can't read props (gesture
  `onStart`, `useAnimatedReaction`).

**Diagnostic tell:** swap looks right for an instant then both cards animate back to their
original positions = a slot-relative dragged-tile transform racing cleanup. A persistent
±itemW overlap = the detach bug above. A ~CAROUSEL_FLOW_MS drift apart = armed animation.

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

**Fix:** in the worklet, BEFORE the dragged-tile (`selfDragging`) branch, add
`if (dragSettling) return { transform: [{ translateX: 0 }] }`. On the settle frame the DOM
has already placed EVERY tile (dragged + siblings) in its final slot, so 0 is correct by
construction — don't re-derive it from origin/target/slot, and don't let the dragged tile fall
into a dragX/slot-relative branch. (Putting it first is what also prevents the revert; see the
dragSettling-FIRST section.)

**Belt-and-suspenders:** also return `translateX: 0` IMMEDIATELY (plain, no `withTiming`)
when no drag is active (`dragOriginIdx < 0 || dragTargetIdx < 0`). A `withTiming(0)` at rest
means any stale release frame can animate a long tail; the instant return kills that drift.

**Diagnostic tell:** if the post-release artifact lasts ~`CAROUSEL_FLOW_MS` (vs a 1-frame
flash), the cause is an armed animation (batching/snapshot), not a slot mismatch.

## Auto-scroll reaction must be OFF during the release glide (long-drag revert)

A long drag that engages edge auto-scroll exposes a separate revert: the dropped card
lands one slot to the RIGHT (swaps with its right neighbor). Root cause = the
`useAnimatedReaction` that recomputes the drop target from `scrollX` was gated only on
`selfDragging===1`, which stays 1 through the 180ms release glide. If `scrollX` shifts while
the carousel settles, the reaction fires `applyDrag` mid-glide → overwrites the glide's
`dragX` `withTiming` and recomputes `dragTargetIdx` → the card lands a slot off.

**Fix:** gate the reaction on `selfDragging===1 && dragActive===1`. `dragActive` is set 0 in
`onFinalize` (before the glide) and 1 only during the active gesture, so the reaction tracks
auto-scroll during the real drag but goes silent during the glide. Keep `selfDragging` in the
gate so only the dragged tile's reaction writes the shared target.

**Belt-and-suspenders for the post-commit gap window:** reset `dragOriginIdx`/`dragTargetIdx`
to -1 SYNCHRONOUSLY inside the `commitReorder` `unstable_batchedUpdates` batch, not only in
the per-tile cleanup `useEffect` (which runs a tick later). Otherwise the just-dropped card —
already past `selfDragging` — can fall into the gap branch with stale origin/target and get
`+itemW`, shoving it onto its right neighbor.

**Why long-drag-specific:** short drags don't trigger auto-scroll, so `scrollX` is static
during the glide and the reaction never fires — the bug only manifests when dragging across
the whole carousel.

## `onFinalize` fires even when the pan NEVER activated → guard the commit

`Gesture.Pan().activateAfterLongPress(ms)` runs `onFinalize` on EVERY touch release,
including a short tap that never crossed the long-press threshold (the gesture went
BEGAN→FAILED). In that case `onStart` never ran, so `dragOriginIdx`/`dragTargetIdx` keep
whatever value they had. Once `commitReorder` started resetting origin/target to -1 (the
post-commit gap fix above), a plain tap on a selected card flowed -1 into `moveActiveTo`,
which clamped it to 0 → the card JUMPED TO THE FRONT on a mere tap.

**Fix:** gate the commit on a dedicated UI-thread "did activate" shared value, set to 1 ONLY
in `onStart` and checked/cleared in `onFinalize` (`if (didActivate.value !== 1) return`).
Do NOT reuse `selfDragging` for this — `selfDragging` is also reset by a JS `useEffect` keyed
on `isDragging`, so gating on it couples the decision to JS render timing (architect flagged
this; could skip a legit drop if `isDragging` flips around finalize). **Belt-and-suspenders:**
also no-op `moveActiveTo` on `idx < 0` so an invalid target can never clamp to front.

## NEVER `runOnJS(console.log)` inside a worklet/reaction (native crash on device)

A diagnostic `runOnJS(console.log)("...", val)` inside a `useAnimatedReaction` crashed the app
(hard close, no JS error) — but ONLY on real drags, because that's the only path where the
reaction's condition fired. Symptom looked like "drag works then app closes on drop" while
taps (reaction never fires) merely misbehaved. `runOnJS` wrapping a native/host function like
`console.log` is the trap. To log from a worklet, call a plain JS callback you defined, or a
`runOnJS`-wrapped arrow that calls `console.log` internally — never wrap `console.log` directly.

## Still-true general rule about `layout={undefined}`

Never set `Animated.View layout={undefined}` to "pause" layout animation — it freezes the
last snapshot at the old slot and ghosts on re-enable. Keep layout always-on and make it
instant for the phase you don't want animated: `layout={LinearTransition.duration(instant ?
0 : NORMAL_MS).easing(EASE)}`.
