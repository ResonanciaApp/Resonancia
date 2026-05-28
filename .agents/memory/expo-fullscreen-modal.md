---
name: Expo Router fullscreen player pattern
description: How to make a player/modal screen truly edge-to-edge with no iOS modal gap and no clipping header.
---

Default `presentation: "modal"` on an Expo Router Stack.Screen leaves the iOS modal's top gap (status bar area visible behind). For a true fullscreen player:

1. Set `presentation: "fullScreenModal"` on the Stack.Screen.
2. Add `<StatusBar hidden />` from `react-native` at the top of the screen.
3. Do NOT render a flow-layout navBar at the top — it eats vertical space and clips any visual element that needs to extend above (e.g. animated halo rings around an artwork).
4. Float header controls (close X, favorite heart) as `position: "absolute"` children at the root, with `top: topPad + 8`, `left`/`right` 16, `zIndex: 10`. Use a small fixed `topPad` like 12 (not `insets.top`) since the status bar is hidden.

**Why:** Spent several iterations on the player trying to "fix" rings being clipped while keeping a navBar. The real issue was always the navBar consuming the only vertical room the rings could occupy. Floating buttons + hidden status bar + fullScreenModal removes the constraint entirely.

**How to apply:** Any screen where decorative content needs to extend to the actual top edge of the device — player, lightbox, immersive viewer. Don't combine with SafeAreaView at the top; the floating buttons are the only top-edge UI.
