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

**Scope limitation:** root providers/nav (`app/_layout.tsx`,
`app/(tabs)/_layout.tsx`), `SacredBackground`'s fallback, the drawer menu,
and several high-traffic tab screens (Inicio, Medita, Video, Colección,
Perfil) read from the theme. Screens with their own dedicated decorative
identity (e.g. the Mezclador tab's per-category `ImageBackground`, the
Mezclador sheet's user-customizable preset backgrounds, Resonadores' hero
image) are deliberately excluded — forcing the generic Scene theme onto
them would clobber intentional, unrelated art direction. A long tail of
lower-traffic screens/components still hardcodes brand hex backgrounds
directly and will NOT react to a Scene change until migrated. Do not
assume "global theme" means every screen already reacts — check whether a
given screen reads `useSceneTheme()`/uses `SacredBackground` before
claiming it's themed. Cold-start flash is mitigated by resolving the
persisted Scene id before the splash screen hides and passing it into
`SceneThemeProvider` as `initialSceneId` (see `loadPersistedSceneId`).

**Universo (tibet) gradient corregido (jul 2026):** el gradiente real de Universo es azul `#2D1C52→#261F57→#1F255A→#1F2A62→#283673→#2D4082`, solid `#2d4081`. El morado viejo (`#340866…#23044D`) quedó obsoleto; varias pantallas lo sobreescribían hardcodeado con el azul — al tocar temas, confiar en lo que se VE, no solo en config/scene-themes.ts; quedan overrides hardcodeados del azul (session/[id].tsx, carpetas) que ahora son redundantes.
