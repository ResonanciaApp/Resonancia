---
name: Reanimated drag-to-reorder without ghost flash
description: Why ANY JS-driven DOM reorder flickers on drop, and the stable-DOM-order FLIP/transform model that finally fixed it in the Geometrix carousel
---

## Winning model: STABLE DOM order + pure transform positioning (FLIP)

The durable, race-free fix for the Geometrix drag-to-reorder carousel is to NEVER reorder the
DOM for a reorder at all. Render tiles in a STABLE keyed order (`domOrder` = all base geometry
ids in natural order + active duplicate instance ids, deterministic) and position each tile
PURELY by transform from a shared visual order:

- `orderSV: SharedValue<string[]>` holds the visual order; a `useEffect` mirrors it from the
  derived `carouselOrder` (`instantOrderFlag.value = 0; orderSV.value = carouselOrder`).
- Each tile derives its slot on the UI thread: `slotSV = useDerivedValue(() => orderSV.value.indexOf(id))`.
  Resting position = `slot * itemW + slideOffset`, read DIRECTLY from `slotSV` in the animated
  style — no posSV-vs-style mapper round-trip, no JS prop lag.
- The container (`gridRow`) is `position:"relative"` with inline `width = domOrder.length*itemW`
  and `height = tileW`; tiles are `position:"absolute"` (`left:0, top:0`). Slot spacing comes
  ONLY from `translateX = slot*itemW` (itemW = tileW + gap), never from margin/flex order.

**Why this beats the older "pin + reorder-on-release" model:** any model that reorders the
`active` array on drop — even with `LinearTransition.duration(0)` and a one-frame "settle"
guard — still asks React/Fabric to perform a LAYOUT COMMIT to move tiles between DOM slots.
That commit runs a frame or two after the UI-thread transform already placed the tile, so the
two race for one frame → an intermittent 1-frame flicker on drop that no guard fully closes.
Keeping the DOM order fixed removes the layout commit entirely, so there is nothing left to
race. (This SUPERSEDES the whole `dragSettling`/`settleSV`/unmask-reaction machinery below —
see "Superseded".)

## Drop commit is a single atomic UI-thread worklet (no runOnJS in the hot path)

On release, glide the dragged tile to its target with `dragX = withTiming((target-origin)*itemW)`.
In that `withTiming` COMPLETION callback (UI thread), do every state write in ONE block:
1. `instantOrderFlag.value = 1` (next order change is instant, not a slide),
2. splice `orderSV` (remove at `origin`, insert at clamped `target`),
3. `dragX.value = 0`, `selfDragging.value = 0`, `dragOriginIdx/target = -1`,
4. THEN `runOnJS(onDragEnd)(id, target)`.

Pixel continuity holds by construction: pre-commit the dragged tile sits at `origin*itemW +
dragX_final = target*itemW`; post-commit at `newSlot(=target)*itemW + 0` — identical. Siblings:
the gap reaction sees `origin=-1` in the same mapper pass → gap snaps to 0 (instant, because
`instantOrderFlag===1`) exactly as their slot absorbs the previous ±itemW. The JS `onDragEnd`
(`moveActiveTo` + `setDraggingId(null)`, batched) then recomputes `carouselOrder`; the mirror
effect rewrites `orderSV` with IDENTICAL content → visual no-op.

## Slot-space correctness: front-relative indices splicing the full-order array is SAFE

`orderSV`/`carouselOrder` = `[...front, ...tail]` where `front` = selected non-activating tiles
and `tail` = everything else (all base ids). `dragOriginIdx`/`dragTargetIdx` are FRONT-relative
slots, yet the drop worklet splices them into the FULL `orderSV` array. This is correct ONLY
because `draggable = selected && !activating` (front tiles only), so a front tile's full-array
index equals its front index (front is the head prefix), and a splice with `origin,target <
frontCount` permutes just the head — exactly what `moveActiveTo` does to `active`. Invariant to
preserve: activating ids always form a SUFFIX of `active` (new selections appended, dups
inserted within the front), so `active`-index == front-index for all reachable states. If you
ever make a non-front tile draggable, this mapping breaks.

## Selection slide = FLIP via slideOffset; mount of a new duplicate = hide until ordered

- Selection/deselection slide: a `useAnimatedReaction(() => slotSV.value)` inverts
  (`slideOffset = (prev-slot)*itemW`) then `withTiming(0)` over `CAROUSEL_FLOW_MS` (1100ms).
  Guard `prev<0 || slot<0 || slot===prev` so a freshly-mounted tile doesn't bogus-slide. If
  `instantOrderFlag===1` (drop commit) set `slideOffset=0` instantly (no slide).
- New duplicate: it enters `carouselOrder` the same render but `orderSV.indexOf(id)` is -1 for
  ~1 frame until the mirror effect runs. In `wrapStyle`, `slot<0 → {opacity:0}` so it doesn't
  flash at slot 0. No stuck-hidden path: `moveActiveTo` always returns a NEW `active` ref (even
  a same-slot drop) → `carouselOrder` recomputes → mirror effect resets `instantOrderFlag=0`.

## Never toggle an animated style in/out of the style array (detach leaves stale transform)

`style={[base, dragging ? wrapStyle : staticRest]}` does NOT reset the transform — detaching a
`useAnimatedStyle` leaves its LAST transform stuck on the native node. Keep ONE
`useAnimatedStyle` ALWAYS in the array and express EVERY state (drag, gap, slide, rest=translateX
of `slot*itemW`) inside the worklet, with an explicit deps array. Diagnostic: a PERSISTENT
±itemW overlap = detach-stale-transform; a 1-frame flash = a layout-commit race (use FLIP).

## Auto-scroll reaction must be OFF during the release glide (long-drag revert)

The `useAnimatedReaction` that recomputes the drop target from `scrollX` must be gated on
`selfDragging===1 && dragActive===1`. `dragActive` is set 0 in `onFinalize` BEFORE the glide;
`selfDragging` stays 1 until the commit. If the reaction stays live during the glide, a settling
`scrollX` fires `applyDrag` → overwrites the glide's `dragX` and recomputes the target → the card
lands a slot to the right (swaps with its right neighbor). Only manifests on long drags (short
drags never engage edge auto-scroll, so `scrollX` is static).

## `onFinalize` fires even when the pan NEVER activated → guard the commit

`Gesture.Pan().activateAfterLongPress(ms)` runs `onFinalize` on EVERY touch release, including a
short tap (BEGAN→FAILED) where `onStart` never ran. Gate the commit on a dedicated UI-thread
`didActivate` shared value set to 1 ONLY in `onStart` and checked/cleared in `onFinalize`
(`if (didActivate.value !== 1) return`). Do NOT reuse `selfDragging` (a JS `useEffect` keyed on
`isDragging` also resets it → couples the decision to render timing). Belt-and-suspenders: no-op
`moveActiveTo` on `idx < 0`.

## NEVER `runOnJS(console.log)` inside a worklet/reaction (native crash on device)

A diagnostic `runOnJS(console.log)("...", val)` inside a `useAnimatedReaction` hard-crashed the
app (no JS error) — but ONLY on real drags (the only path firing the reaction). `runOnJS`
wrapping a native/host function like `console.log` is the trap. To log from a worklet, call a
plain JS callback you defined, never wrap `console.log` directly.

## Still-true general rule about `layout={undefined}`

Never set `Animated.View layout={undefined}` to "pause" layout animation — it freezes the last
snapshot at the old slot and ghosts on re-enable. If you DO use layout animations elsewhere,
keep them always-on and make them instant for the phase you don't want animated:
`layout={LinearTransition.duration(instant ? 0 : NORMAL_MS).easing(EASE)}`. (In Geometrix this
no longer drives the reorder — FLIP/transform does — but `LinearTransition` still animates the
add/remove of the duplicate list.)

## Superseded (DO NOT reintroduce): the pin + DOM-reorder-on-release model

An earlier model PINNED the dragged tile (origin DOM slot, follows finger via `dragX`) and
reordered `active` ONCE on release inside `unstable_batchedUpdates`, using a `dragSettling`
state + `instantLayoutSV`/`settleSV` shared flags to force `LinearTransition.duration(0)` for
the single commit frame, plus a `useAnimatedReaction(dragOriginIdx → -1)` to "unmask" settling
after the painted frame, plus a `dragSettling`-FIRST guard returning `translateX:0` for all
tiles on the commit frame. It got VERY close but still flickered intermittently, because the
DOM reorder is a Fabric layout commit that races the UI-thread mapper for one frame — a race no
amount of guard ordering removes. The FLIP model above deletes the layout commit, so all of
this machinery (`dragSettling`, `settleSV`, `instantLayoutSV`, the unmask reaction, the
settle-frame "translateX 0 by construction" guard, the synchronous-origin-reset trap) is GONE.
If you find yourself adding a "settle frame" guard around an `active` reorder, stop — position
by transform over a stable DOM order instead.
