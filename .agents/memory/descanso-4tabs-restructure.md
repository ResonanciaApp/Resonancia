---
name: Descanso screen 4-tab restructure
description: Descanso tab replaced sound-grid (dormirme/zen/relax/ruido) with 4 tabs; how session vs sound tabs differ
---

`app/(tabs)/descanzo.tsx` has 4 tabs: Historias, ASMR, Sonidos Binaurales, Ambientales.

- Historias/ASMR are session tabs — render a 2-col `SessionCard` grid via `getSessionsByDescansoTag`. ASMR sessions typically set `skipDetail: true` (no dedicated detail page, plays inline).
- Binaural/Ambientales are sound tabs (`SOUND_TAB_IDS`) — keep the old banner+NightTimerSheet+soundGrid UI, backed by `data/descanso-sounds.ts` (`DescansoSoundCategory: "binaural" | "ambiental"`).
- The category enum (`binaural`/`ambiental`) is duplicated across: `lib/db/src/schema/descanso-sounds.ts`, `lib/api-spec/openapi.yaml` (2 places: Create/UpdateDescansoSoundBody), `resonancia-admin/src/pages/descanso-sonidos.tsx` CATEGORIES — all must move together, then run `api-spec codegen` + `db push`.

**Why:** old 4 sound categories (dormirme/zen/relax/ruido) were replaced entirely per product decision; DB table was empty at migration time so no data backfill was needed — if the table has data next time, this enum swap needs a migration step.

La categoría global `historias` es independiente del tab Historias de Dormir. No mover, duplicar ni reclasificar las sesiones con `descansoTag` de historias cuando se trabaje en la categoría global.

**Why:** el producto confirmó que la categoría principal Historias comienza vacía y no debe alterar la cola, búsqueda ni clasificación nocturna de Dormir.

**Gotcha:** session image pool is sparse — no `session-3.jpg` exists (jumps 1,2,4,5...65, `.png` starts at 56). Always verify a numbered session image exists before `require()`-ing it, or Metro web bundling fails with "Unable to resolve".
