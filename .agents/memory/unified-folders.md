---
name: Carpetas unificadas (playlists + mezclas)
description: Una misma carpeta de usuario acepta playlists y mezclas; conviven con las mixFolders legacy
---
Las carpetas de usuario (`Folder` en FoldersPlaylistsContext, key `@resonance_folders`) tienen `presetIds?` para guardar mezclas, además de playlistIds/sessionIds/subFolderIds. Mutators: addMixToFolder/removeMixFromFolder/isMixInFolder (mismo nombre que en MixerContext — aliasear al destructurar ambos hooks).

**Reglas:**
- `carpeta/[id].tsx` renderiza playlists Y mezclas (MixCover + load/play, igual que carpeta-mezcla).
- Una mezcla archivada en carpeta de usuario se oculta de la lista plana del tab Mezclas y de la vista general (mismo patrón que playlists→carpetas).
- El tab Mezclas también renderiza las carpetas de usuario que contienen ≥1 mezcla (FolderRow → /carpeta/:id), junto a las mixFolders legacy.
- "Crear una carpeta" del tab Mezclas crea carpeta unificada (nombreCarpetaVisible), NO mixFolder.
- Las mixFolders legacy (MixerContext, `@resonance_mixer_folders`, /carpeta-mezcla) siguen vivas para carpetas viejas; el picker de MixActionsSheet muestra ambas (unificadas primero).

**Why:** el usuario pidió un solo tipo de carpeta para playlists y mezclas (ago 2026).
