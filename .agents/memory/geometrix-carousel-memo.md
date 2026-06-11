---
name: Geometrix carousel memo extraction
description: Por qué GeometrixCarousel es un React.memo separado y qué posee
---

## Regla

`activeCategory` (estado del filtro de pills) y TODO el estado interno del carrusel viven en `GeometrixCarousel` (React.memo), no en `GeometrixScreen`.

**Why:** Pulsar una píldora llama `setActiveCategory()`. Si ese estado vive en el parent de 6700 líneas, se re-renderiza TODO (canvas, settings, gestos…) → ~1 s de lag visible. Con el estado en el sub-componente, solo se re-renderiza `GeometrixCarousel` (~230 líneas + 44 CarouselTile memo-checks) → imperceptible.

**How to apply:**
- `GeometrixCarousel` posee: `carouselScrollRef`, `carScrollX/Max`, `carDragActive`, `carEdgeIntent`, `dragOriginIdx/Target`, `carScrollHandler`, `useFrameCallback`, `activeCategory`, `carouselOrder`, orderSV sync effect, `domOrder`, batch-mount + bg-preload logic, `tilesToRender`, `tileW`, `tileItemW`, `frontIds`, JSX pills + carousel + divider.
- El parent (`GeometrixScreen`) pasa como props (todas referencias estables en category-switch): `active`, `effActivating`, `orderSV`, `instantOrderFlag`, `draggingId`, `toggleGeometry`, `handleDragStart`, `commitReorder`, `getSettings`.
- `effActivating` y `carouselTimers` siguen en el parent (usados por `toggleGeometry` y otras partes del canvas).
- Al añadir lógica nueva al carrusel, colocarla en `GeometrixCarousel`, no en el parent.
