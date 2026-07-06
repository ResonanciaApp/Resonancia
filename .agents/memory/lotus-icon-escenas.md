---
name: Lotus icon repurposed to Escenas panel
description: Home screen lotus icon no longer navigates to /profile; it opens the Escenas (ambient sound) bottom sheet instead.
---

The lotus icon (top-right of Inicio, `MaterialCommunityIcons name="spa"`) used to navigate to `/profile`. It now opens the "Escenas" bottom sheet (`EscenasSheet.tsx`), which lets the user pick an ambient sound scene and control its volume — same interaction pattern as the Mixer's `MixerSheet`.

**Why:** Task #81 asked for the lotus icon to open the Escenas panel. The user could not be reached to confirm whether Profile access should move elsewhere, so the decision was made to keep Profile reachable only via `DrawerMenu.tsx` ("Ver Perfil"), which already existed as an alternate path. If a direct profile shortcut on Inicio is needed later, that's a separate follow-up, not a revert of this change.

**How to apply:** `AmbientPlayerContext.tsx` now owns per-scene volume (`Record<SceneId, number>`) and its own sheet-open state (`isSheetOpen`/`openSheet`/`closeSheet`), mirroring `MixerContext`'s pattern. `AmbientWidget.tsx` remains unused/unmounted dead code — it was not touched or wired up; `EscenasSheet.tsx` is the new, separate UI actually mounted in `_layout.tsx`.
