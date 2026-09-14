---
name: Etiquetas editoriales por categoría
description: Convención para aislar etiquetas nuevas sin destruir themeTag históricos.
---

Las etiquetas editoriales de categorías distintas de Música se guardan dentro de `themeTag` con un prefijo interno por tipo de categoría; Admin las codifica y Mobile las decodifica. Música conserva valores sin prefijo.

**Why:** `themeTag` ya contenía temáticas globales históricas. Tratar esos valores como etiquetas nuevas mezclaba categorías y cambiaba carruseles existentes.

**How to apply:** Cualquier alta, renombrado, borrado, filtro o consumidor móvil de estas etiquetas debe usar la misma codificación por categoría. Los prefijos nunca deben mostrarse en UI ni filtros globales.

En Mobile, las subcategorías históricas organizan tabs y carruseles de la pantalla principal. Al abrir una subcategoría, sus filtros son Ver todo, 5 min, 10 min, 11+ min y las etiquetas editoriales presentes en esas sesiones. Las etiquetas editoriales nunca crean tabs o carruseles principales.