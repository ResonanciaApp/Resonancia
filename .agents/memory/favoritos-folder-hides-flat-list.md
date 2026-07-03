---
name: Favoritos folders hide sessions from flat list
description: Deliberate UX exception where moving a favorite into a folder removes it from the flat Favoritos list, unlike Playlist/Mezclas folders.
---

In the Favoritos tab, a session that belongs to any `FavFolder` is filtered out of the flat/top-level favorites list (both grid and list views). It only appears inside its folder.

**Why:** explicit user request — Favoritos intentionally diverges from the Playlist and Mezclas folder pattern, where folder membership is purely organizational and items still show in the flat list. Do not "fix" this back to match Playlist/Mezclas; it is correct as-is for Favoritos.

**How to apply:** the flat list is derived, not stored — compute a `Set` of all session ids across `favFolders[].sessionIds` and exclude them when building the displayed favorites array. No context/state changes are needed; removing a session from a folder automatically makes it reappear in the flat list since the filter is applied at render time.
