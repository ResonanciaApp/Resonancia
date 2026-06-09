---
name: Reanimated layout-prop toggle ghost flash
description: Toggling Animated.View layout={undefined} during a drag leaves a stale snapshot that flashes the element at its old slot on re-enable
---

When an `Animated.View` has `layout={LinearTransition...}` and you toggle that prop to
`undefined` while dragging (to stop layout animation fighting the finger), Reanimated
stops taking layout snapshots. The last snapshot is frozen at the slot the element was in
when `layout` went `undefined`. When the prop flips back to a real transition on release,
Reanimated interpolates FROM that stale (old) slot TO the current slot → a ghost of the
card flashes at its pre-drag position for a frame, then settles.

**Rule:** never set `layout={undefined}` to "pause" layout animation. Keep it always-on and
make it instant during the phase you don't want it to animate:
`layout={LinearTransition.duration(isDragging ? 0 : NORMAL_MS).easing(EASE)}`.
`duration(0)` keeps snapshots fresh (instant slot moves, no ghost on release); `undefined`
deactivates snapshotting (stale origin). Fallback `duration(1)` if a platform misbehaves.

**Why:** observed in Geometrix carousel drag-to-reorder — selected card flashed at its old
right-side slot just before settling into the new position.

**How to apply:** any drag/reorder where the dragged item disables layout animation while a
transform follows the finger. Pair with translateX compensation as before.

## Mid-drag right/left jump at slot crossings (related, distinct bug)

Separate from the release ghost: while dragging across a slot boundary the dragged card
jumps right then snaps left into place. **Cause:** the translateX compensation
(`dragX = effectiveTx - (slot - originSlot)*itemW`) was computed from the *predicted* slot
set synchronously on the UI thread, but the real DOM reorder (`runOnJS(setActive)`) commits a
frame or two later. For that gap the card is over-compensated (predicted slot moved, DOM
hasn't) → flashes right, then snaps back when the DOM catches up.

**Rule:** compensate against the **real rendered slot** (a shared value mirrored from the
rendered `indexInFront` via `useEffect`), NOT the predicted index. Keep the predicted index
only to dedup the `setActive` call. Add a `useAnimatedReaction` on that real-slot SV (gated to
the tile being dragged) that re-runs the compensation when it changes, using a stored
`lastEffectiveTx`. Then the base shift (DOM reorder) and the dragX adjustment land in the same
tick → net-zero, no jump.

**Why:** observed in Geometrix carousel after adding edge auto-scroll — most visible swapping
into the first card. **How to apply:** any worklet that predicts a reorder before an async
`runOnJS` state update commits it; never compensate a transform against the prediction, only
against the committed/rendered position.
