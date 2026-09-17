---
name: Etiquetas editoriales por categoría
description: Convención para aislar etiquetas nuevas sin destruir themeTag históricos.
---

Las etiquetas editoriales de categorías distintas de Música se guardan dentro de `themeTag` con un prefijo interno por tipo de categoría; Admin las codifica y Mobile las decodifica. Música conserva valores sin prefijo.

**Why:** `themeTag` ya contenía temáticas globales históricas. Tratar esos valores como etiquetas nuevas mezclaba categorías y cambiaba carruseles existentes.

**How to apply:** Cualquier alta, renombrado, borrado, filtro o consumidor móvil de estas etiquetas debe usar la misma codificación por categoría. Los prefijos nunca deben mostrarse en UI, filtros globales ni auto-crear cards de “Otras temáticas”; servidor y Mobile deben excluirlos.

En Mobile, las subcategorías organizan tabs y carruseles de la pantalla principal. Al abrir una subcategoría, sus filtros son Ver todo, 5 min, 10 min, 11+ min y las etiquetas editoriales presentes en esas sesiones. Las etiquetas editoriales nunca crean tabs o carruseles principales.

En Admin, la sección “Subcategoría” contiene dos niveles para Charlas, Historias y Ambientales: primero una subcategoría obligatoria editable que crea los tabs; debajo “Nombre de colección (opcional)”, cuyas etiquetas crean pantallas internas dentro del tab. “Otras temáticas” sigue siendo un grupo histórico separado y no debe eliminarse al añadir estas taxonomías.

El filtro global “Otras temáticas” debe usar exclusivamente sus nueve opciones canónicas, no inferirse desde todos los `themeTag` sin prefijo: los datos históricos incluyen Chakras y etiquetas de prueba que pertenecen a otras taxonomías.

“Etiqueta Dormir” y sus opciones históricas (Binaurales, Ancestrales y ASMR) también están obsoletas y no deben mostrarse al crear o editar Música. Los datos heredados pueden conservarse internamente al guardar sesiones antiguas.

En modo edición, las secciones “Subcategoría” y “Etiquetas” deben renderizarse siempre para cualquier sesión. La primera muestra el selector canónico aplicable o informa que la categoría no tiene subcategorías; la segunda conserva todos los grupos editoriales.

Admin tiene dos superficies de edición: la página completa y el diálogo de Moderación. Toda modificación de taxonomías debe mantenerse idéntica en ambas; el diálogo antiguo fue la causa de que reapareciera “Etiqueta de sueño (Grupo 2)” y faltaran colecciones.