---
name: Mix folders pattern (Mezclas)
description: How mix folders in Tu Biblioteca mirror the Playlist folder pattern, and where they intentionally diverge.
---

`MixFolder` in `MixerContext.tsx` mirrors `UserFolder`/playlist folders: CRUD (create/rename/delete/togglePin/addMixToFolder/removeMixFromFolder) + AsyncStorage persistence, `app/carpeta-mezcla/[id].tsx` mirrors `app/carpeta/[id].tsx`.

**Divergence (intentional):** the "Crear una mezcla" / "Crear una carpeta" placeholder buttons live *inside* the "mezclas" tab content (shown even in the non-empty list), unlike Playlists where equivalent buttons only appear in the general/overview view.

**Why:** Mezclas doesn't have a separate general tab to host those actions, so they were placed at the bottom of the mezclas tab itself to stay discoverable regardless of list length.

**How to apply:** if the Playlist creation-button pattern changes, check whether Mezclas needs the same divergence preserved or reconciled.
