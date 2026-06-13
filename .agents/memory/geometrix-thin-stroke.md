---
name: Geometrix trazo fino (strokeMode) vs relleno
description: Por qué "fino" no afecta a ciertas geometrías y cómo el admin decide mostrar el control "Trazo"
---

# Geometrix: trazo fino solo aplica a geometrías de LÍNEA

`strokeMode: "thin"` se traduce a `thinFactor` (≈0.45) → `strokeScale` en `SacredGlyph`, que **solo** multiplica atributos `stroke-width="…"` del SVG (`GLYPH_STRINGS[id]`). Por eso:

- Las geometrías de **relleno** (mosaicos: `c-asset-*`, `k-asset-*`, `r-asset-*`, `r-Ngeometry*`) usan `fill="GLYPH_STROKE"` **sin** `stroke-width` → "fino" no tiene NINGÚN efecto visual en ellas (no hay grosor de línea que reducir).
- Solo las ~44 geometrías dibujadas con líneas (merkaba, flor-vida, metatron, sri-yantra, etc.) tienen `stroke-width` → ahí "fino" sí se nota.

**`geometryType` (wireframe/mosaic) NO se consume en ningún render del móvil** — es solo metadato de catálogo/admin. Cambiar un mosaico a "wireframe" en el admin no convierte su SVG de relleno a líneas; antes solo destrababa un control "Trazo" que no hacía nada.

**Why:** un usuario marcó `c-asset-12` como wireframe+thin esperando verlo más fino; el guardado/DB/sync funcionaban, pero el asset es de relleno → cero efecto. Confusión clásica.

**How to apply:** el control "Trazo" en `resonancia-admin/src/pages/geometrix.tsx` se gatea por una propiedad INTRÍNSECA: `/stroke-width="[^"]+"/.test(GLYPH_STRINGS[id])` (misma regex que usa SacredGlyph al escalar), NO por el `geometryType` editable. Si en el futuro una geometría "debería" soportar fino y no aparece el control, el problema está en su SVG (convertir a strokes), no en el geometryType. El móvil cachea estos ajustes ~5 min (TanStack Query) → hace falta RA para ver cambios del admin.
