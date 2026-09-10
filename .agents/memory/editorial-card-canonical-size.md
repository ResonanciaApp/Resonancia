---
name: Alto canónico de cards editoriales
description: Restricción visual para el alto compartido y el ancho local de las cards editoriales.
---

Las cards editoriales de Dormir, Inicio, categorías, tags y Ambientales deben mantener el alto derivado de la card canónica de Música para dormir. En las grids de categorías, el ancho sigue siendo el ancho local calculado para dos columnas, de modo que la fila quede completa y sin espacio sobrante. Esas grids muestran título y autor, sin la categoría encima; los carruseles sí conservan la categoría.

**Why:** Escalar el alto desde anchos locales agrandó las cards; fijar también el ancho canónico dejó espacio sobrante a la derecha en las grids.

**How to apply:** Calcular el alto editorial desde la fórmula canónica de Música para dormir, independientemente del ancho local. Los carruseles usan el ancho canónico y muestran categoría; las grids mantienen su ancho de columna y omiten categoría. Ambientales respeta la misma geometría aunque oculte autor y duración.