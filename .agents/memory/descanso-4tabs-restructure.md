---
name: Dormir como supercategoría multi-tag
description: Taxonomía canónica y reglas editoriales de las colecciones dinámicas de Dormir
---

Dormir es una supercategoría transversal: no reemplaza ni cambia la categoría original de una sesión. La fuente activa es un array multi-tag con ocho valores, en este orden editorial:

1. Música para dormir
2. Meditaciones para dormir
3. Historias para dormir
4. Sonidos para dormir
5. Paisajes sonoros
6. Para niños
7. Sonidos de lluvia
8. Ruido

Solo aparecen accesos y carruseles para tags usados. No existe “Todos” ni selección por defecto; cada acceso abre una pantalla independiente. Una sesión multi-tag aparece en cada carrusel correspondiente, pero la cola global de Dormir debe deduplicarla por ID.

**Why:** el producto confirmó que Dormir debe reunir contenido nocturno de Música, Meditaciones, Historias, Sonidos y otras categorías sin fusionarlas ni reclasificarlas.

**How to apply:** creación/edición, snapshots, filtros y render deben usar el array canónico. El campo escalar anterior solo sirve para leer datos o cachés durante la transición; nunca debe volver a escribirse.

**Gotcha:** session image pool is sparse — no `session-3.jpg` exists (jumps 1,2,4,5...65, `.png` starts at 56). Always verify a numbered session image exists before `require()`-ing it, or Metro web bundling fails with "Unable to resolve".
