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
