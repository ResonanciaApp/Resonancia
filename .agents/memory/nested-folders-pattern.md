---
name: Nested folders pattern (Playlist/Mezclas/Favoritos)
description: How subfolder nesting + unified long-press action sheet works across the three Biblioteca folder types, and the cycle-prevention rule.
---

Playlist, Mezclas (Mix), and Favoritos folders all support one level of arbitrary-depth nesting via an optional `subFolderIds?: string[]` array on the folder type, plus add/remove/isInFolder helper functions in their respective contexts (`FoldersPlaylistsContext`, `MixerContext`).

Each folder type has its own long-press action sheet (`PlaylistActionsSheet`, `FavoriteActionsSheet`, `MixActionsSheet`) that was generalized to accept an `itemKind`/`folder` mode alongside its normal item mode, exposing: Fijar, Mover a una carpeta (nested target picker), Renombrar, Eliminar. These sheets self-handle folder deletion/rename via their own context hooks — callers don't need to pass those callbacks explicitly when rendering the folder-mode instance.

**Why:** the reference implementation (`app/carpeta/[id].tsx` for Playlist) already had this; the pattern was replicated for Mezclas/Favoritos rather than invented independently, keeping the three systems structurally parallel.

**How to apply:** when adding folder-nesting UI to a new collection type, mirror this exact shape — folder type gets `subFolderIds?`, context gets add/remove/isInFolder helpers, and the "move to folder" picker must compute `getDescendantXFolderIds(id)` recursively over `subFolderIds` to exclude self + all descendants from the eligible target list (prevents cycles). Favoritos has one deliberate divergence: see `favoritos-folder-hides-flat-list.md`.
