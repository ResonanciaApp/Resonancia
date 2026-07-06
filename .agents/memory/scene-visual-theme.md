---
name: Scene visual theme (global background)
description: How the app-wide visual theme tied to Escenas selection is implemented, its intentional scope limits, and the independent-persistence decision vs ambient audio scene.
---

The Escenas panel drives both the ambient audio loop (`AmbientPlayerContext`) and a
global visual theme (`SceneThemeContext`). These are deliberately **separate
contexts with separate AsyncStorage keys**, even though they share the same
`SceneId` set and are updated together from the same user action.

**Why:** `AmbientPlayerContext`'s scene always resets to `"universo"` on cold
boot for native-audio-session safety (see `expo-audio-lockscreen` /
`expo-av-launch-crash` memories) — audio scene is intentionally NOT persisted
across restarts. But the visual theme MUST persist across restarts (task
requirement). Reusing the audio context's scene state for theming would have
silently broken theme persistence. Keeping them independent avoids that
coupling entirely while still updating both from one tap.

**How to apply:** `useSceneTheme()` (theme.solid / theme.gradient) is the
single source of truth for "what should this screen's background be right
now." `SacredBackground` (`variant="solid"`, no explicit `solidColor`) now
falls back to the active theme automatically — prefer wiring NEW screens
through `SacredBackground`/`useSceneTheme()` rather than hardcoding hex
backgrounds.

**Scope limitation (as of implementation):** only the root providers/nav
(`app/_layout.tsx`, `app/(tabs)/_layout.tsx`), `SacredBackground`'s fallback,
and the two highest-traffic screens (Inicio `index.tsx`, Medita
`explore.tsx`) were migrated to read from the theme. The large remaining
surface (~70+ other screens, ~30+ components) still hardcodes brand hex
backgrounds directly and will NOT react to a Scene change until migrated
screen-by-screen. Do not assume "global theme" means every screen already
reacts — check whether a given screen reads `useSceneTheme()`/uses
`SacredBackground` before claiming it's themed.
