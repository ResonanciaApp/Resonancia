---
name: Destacados por categoría (isFeaturedCategory)
description: Flag independiente de isFeatured; dónde se renderiza y limitación en Noches/Mañanas
---

# isFeaturedCategory

Flag DB (`catalog_sessions.is_featured_category`) independiente de `isFeatured` (que alimenta "Para este momento" en Inicio). Se marca desde el panel admin (moderación → "Destacada en su categoría").

**Dónde se muestra:** sección “Contenido destacado” como primer bloque del tab principal en las pantallas de categoría; las landings compartidas derivan el carrusel directamente de `isFeaturedCategory`.

Las cards de “Contenido destacado” son horizontales en todas las categorías y deben replicar el formato 16:9 ampliado de Música. Solo los carruseles normales de colecciones usan las cards editoriales cuadradas.

**Decisión deliberada:** las sesiones destacadas TAMBIÉN siguen apareciendo en la grilla general (duplicado estilo Calm) — no excluirlas.

No calcular las sesiones de una categoría en constantes de módulo: el catálogo remoto hidrata después y las sesiones DB-only quedarían fuera. Filtrar al renderizar y suscribirse a la versión del catálogo.

**Why:** el gate del carrusel es `activeTab === null` (chips) o `activeTab === "Todos"` (noches/mananas); en tabs de subcategoría no se muestra.
