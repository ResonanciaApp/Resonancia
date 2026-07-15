---
name: Destacados por categoría (isFeaturedCategory)
description: Flag independiente de isFeatured; dónde se renderiza y limitación en Noches/Mañanas
---

# isFeaturedCategory

Flag DB (`catalog_sessions.is_featured_category`) independiente de `isFeatured` (que alimenta "Para este momento" en Inicio). Se marca desde el panel admin (moderación → "Destacada en su categoría").

**Dónde se muestra:** sección "Destacados de [categoría]" como primer bloque del tab "Todos" en musica-sonidos / meditaciones-guiadas / sonidos-ancestrales (carrusel horizontal de CategoryCard) y noches / mananas (lista de SessionRow).

**Decisión deliberada:** las sesiones destacadas TAMBIÉN siguen apareciendo en la grilla general (duplicado estilo Calm) — no excluirlas.

**Limitación (Noches/Mañanas):** esas pantallas usan constantes de módulo (`NOCHES_SESSIONS`/`MANANAS_SESSIONS`) y NO se suscriben a `useCatalog().version` → sesiones DB-only (subidas por admin) nunca aparecen ahí, ni sus destacados. Preexistente; si se pide arreglarlo, suscribirlas a useCatalog.

**Why:** el gate del carrusel es `activeTab === null` (chips) o `activeTab === "Todos"` (noches/mananas); en tabs de subcategoría no se muestra.
