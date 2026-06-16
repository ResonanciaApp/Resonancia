---
name: Animated layout-prop slide fails under Fabric
description: RN Animated `left`/`top`/position animated with JS driver doesn't render under New Arch; use native transform
---

# Slide/move animations: native transform, not JS-driver layout props

When animating something to MOVE (slide, spread, shift position) with React
Native's core `Animated` API, do NOT animate a layout prop (`left`, `top`,
`right`, `margin`) via `useNativeDriver: false`. Under Fabric / New Architecture
this frequently does not render — the value updates but the view doesn't move.

**Symptom seen in MiniPlayer:** the mix-thumbnail "slide" (spread when opening
the stack) used animated `left` (JS driver). The container `width` animated fine
(also JS driver) but the thumbnails never moved. Switched the thumbs to a STATIC
`left` + a native-driver `translateX` interpolation (the spring became
`useNativeDriver: true`) and it worked.

**Why:** native-driver animations run on the UI thread via the transform system;
JS-driver layout-prop animations under Fabric can silently fail to commit per
frame. `width` happened to animate, position props did not — inconsistent, so do
not trust JS-driver layout animation under New Arch.

**How to apply:** for any move/slide, keep the resting position static and animate
`transform: [{ translateX/Y }]` with `useNativeDriver: true`. It's fine to mix a
JS-driver `width` on a parent with a native-driver `transform` on its children
(different views) — at worst a one-frame clip mismatch during the spring, which
the container's padding absorbs.
