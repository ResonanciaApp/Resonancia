---
name: Diario (journal) structure
description: How the free-tier Diario screen is structured and where premium extras would go
---

# Diario (free tier)

The free Diario is intentionally minimal: a list screen + a separate modal for
writing one text entry. It deliberately does NOT show "Voz Interior" (voice
memos) or "A no olvidar" (favorites) anymore.

- List: `app/diario.tsx` — top bar (back + "…" menu with "Borrar todo"), big
  "Diario" title, empty state, entries (date column + time + 2-line preview),
  bottom "Añade entrada" button.
- Editor: `app/diario-entrada.tsx` — modal route (registered in `_layout.tsx`),
  X / "Nueva entrada"|"Editar entrada" / Guardar. Optional `?id=` → edit mode
  (shows "Eliminar entrada"). New entry has no id.
- Data: `hooks/useDiario.ts`, single section `"reflexiones"` (ideas were merged
  into it long ago). Palette stays warm/gold — reference screenshots were green
  but that's just the source app, not the desired color.

**Why read-modify-write in useDiario mutators:** the list and the editor each
mount their own `useDiario("reflexiones")` instance. A mutator that wrote the
local `entries` snapshot could clobber data when the editor saved before its
own async hydration finished. So `saveEntry/updateEntry/deleteEntry` now read
the latest array from AsyncStorage first, then persist. List reloads on focus
(`useFocusEffect` + `reload`) to pick up changes made in the modal.

**How to apply (premium later):** `VozInteriorPanel`, `useVozInterior`,
`NoOlvidarCard`, `DiarioFavoritesContext` are still in the repo (and the
provider still wraps in `_layout.tsx`) but are no longer rendered in the free
diary — wire them into the premium section when that's defined.
