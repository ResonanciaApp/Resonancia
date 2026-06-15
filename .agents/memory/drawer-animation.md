---
name: Drawer animation glitches
description: Why the side drawer (DrawerContext/DrawerMenu) animates the way it does — avoiding open jank and reopen flashes
---

# Side drawer animation

Single `drawerAnim` (Animated.Value 0→1) drives both the content push (`PushWrapper` in `app/_layout.tsx`) and the drawer panel slide (`DrawerMenu`). `isOpen` is only a UI gate (overlay pointerEvents + tap-outside Pressable), NOT the motion source.

## Rules (don't regress)

- **Keep `DrawerMenu` always mounted.** Do NOT reintroduce a `rendered`/mount-unmount gate.
  **Why:** mounting the panel via setState during the open animation lagged ~1 frame behind the content push, so the panel "jumped" to catch up → jerky open.
  **How to apply:** panel stays mounted; when closed it sits off-screen at translateX `-DRAWER_PUSH`. No touch capture because the tap-outside Pressable only renders when `isOpen`.

- **Animate imperatively, not via an effect reacting to state.** `open()`/`close()` call `animate()` directly, and `animate()` calls `drawerAnim.stopAnimation()` before every transition.
  **Why:** the old effect-driven model with a separate `instant` state could let an in-flight close timing race a `setValue(1)` instant-reopen → the drawer flashed open/close before settling (seen after navigating Drawer→item→back).
  **How to apply:** instant-reopen-on-home (`markDrawerReopenOnHome` + pathname watcher) uses `stopAnimation()` then `setValue(1)`.

- **Panel shadow only while `isOpen`** (`drawerShadow` style applied conditionally).
  **Why:** with the panel always mounted and its right edge resting at x=0 when closed, the always-on shadow bled a dark strip onto the left screen edge. Conditional shadow avoids the bleed without offsetting translateX (which would create a transient gap between panel edge and pushed content during the arc).
