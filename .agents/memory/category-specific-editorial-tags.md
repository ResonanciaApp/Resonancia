---
name: Etiquetas editoriales por categoría
description: Convención para aislar etiquetas nuevas sin destruir themeTag históricos.
---

Las etiquetas editoriales de categorías distintas de Música se guardan dentro de `themeTag` con un prefijo interno por tipo de categoría; Admin las codifica y Mobile las decodifica. Música conserva valores sin prefijo.

**Why:** `themeTag` ya contenía temáticas globales históricas. Tratar esos valores como etiquetas nuevas mezclaba categorías y cambiaba carruseles existentes.

**How to apply:** Cualquier alta, renombrado, borrado, filtro o consumidor móvil de estas etiquetas debe usar la misma codificación por categoría. Los prefijos nunca deben mostrarse en UI ni filtros globales.

En Mobile, las subcategorías históricas organizan tabs y carruseles de la pantalla principal. Al abrir una subcategoría, sus filtros son Ver todo, 5 min, 10 min, 11+ min y las etiquetas editoriales presentes en esas sesiones. Las etiquetas editoriales nunca crean tabs o carruseles principales.

En Admin, la sección “Subcategoría” muestra solo la subcategoría canónica de la categoría activa. Los campos heredados “Etiqueta Sonidos” y “Etiqueta Podcast” no se muestran, aunque sus valores existentes se preservan al editar. “Otras temáticas” sigue siendo un grupo histórico visible dentro de “Etiquetas” y no debe eliminarse al añadir taxonomías editoriales nuevas.

“Etiqueta Dormir” y sus opciones históricas (Binaurales, Ancestrales y ASMR) también están obsoletas y no deben mostrarse al crear o editar Música. Los datos heredados pueden conservarse internamente al guardar sesiones antiguas.

En modo edición, las secciones “Subcategoría” y “Etiquetas” deben renderizarse siempre para cualquier sesión. La primera muestra el selector canónico aplicable o informa que la categoría no tiene subcategorías; la segunda conserva todos los grupos editoriales.

Admin tiene dos superficies de edición: la página completa y el diálogo de Moderación. Toda modificación de taxonomías debe mantenerse idéntica en ambas; el diálogo antiguo fue la causa de que reapareciera “Etiqueta de sueño (Grupo 2)” y faltaran colecciones.