---
name: Geometrix instance-id model
description: How the same geometry type can appear multiple times (duplicates) with independent settings in Geometrix
---

# Geometrix instance-id model

A geometry layer in Geometrix is identified by an **instance id** (a string), not by its base `GeometryId`.

- Original layers: instance id == base `GeometryId` (e.g. `"flor-vida"`).
- Duplicates: instance id == `` `${base}${INSTANCE_SEP}${unique}` `` (e.g. `"flor-vida::lq3k1"`). `INSTANCE_SEP = "::"`.
- `baseOf(id)` (in `data/geometries.ts`) resolves any instance id back to its base `GeometryId`.

**Rule — base vs instance:** anything that renders the *shape* (`SacredGlyph id=`, `GEOMETRIES.find`, `getGeometry`, glyph meta/name) must use `baseOf(id)`. Anything that is *per-layer state* (the `settings` record, `getSettings`/`updateSetting`, `active`, `hiddenIds`, `selectedId`, `menuGeoId`, `settingsGeoId`, `activatingIds`, carousel timers, `draggingId`, `loupeGeoId`, `pinchTargetId`) must use the full instance id. TypeScript will catch passing a string where `GeometryId` is required (SacredGlyph) but NOT the reverse — a settings lookup with a base id silently merges duplicates. The settings panel body keeps a single `const iid = settingsGeoId!` and uses `iid` everywhere.

**Persistence/sharing:** `GeometrixCreation.active`/`hiddenIds` and shared-glyph `recipe.active` are `string[]` with no per-id enum validation, so instance ids round-trip safely. Previews (`geometrix-creaciones`, `geometrix-comunidad`, `GeometrixCommunitySection`, `profile`) index settings by full id and render glyphs with `baseOf(id)`.

**Duplicar:** `duplicateGeometry(iid)` seeds `defaultSettings(baseOf(iid))` (fresh defaults, NO preset effects), splices the new id at `indexOf(iid)+1` in `active` (immediately right of source), selects it. Carousel order is derived: `front = active.filter(id => !activating.has(id))` then base-id tail. **Why the duplicate cancels the source's activation:** if the source is still in its HOLD/`activatingIds` window, it drops out of `front` and the duplicate lands separated from it — so `duplicateGeometry` clears the source's carousel timer and removes it from `activatingIds` to force both into `front` adjacent.
