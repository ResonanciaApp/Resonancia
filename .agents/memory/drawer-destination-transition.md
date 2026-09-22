---
name: Transiciones desde el drawer
description: Regla para mantener sincronizadas la superficie destino y la reacción visual del menú lateral.
---

Los destinos abiertos desde el drawer deben derivar la entrada de la superficie y la reacción del menú del mismo progreso animado. No basta con igualar duraciones de dos animaciones independientes. La apertura y el cierre invierten ese mismo progreso.

**Why:** Las animaciones separadas se desincronizan bajo carga, al interrumpirse o al cerrar rápidamente. Además, reutilizar el progreso compartido sin registrar el origen cambia por accidente las aperturas normales de esas pantallas.

**How to apply:** Registrar explícitamente si la apertura nació en el drawer. Solo ese origen usa el progreso compartido y mantiene el drawer montado debajo hasta terminar el cierre. Las aperturas desde otras superficies conservan su animación y parallax previos. Invalidar callbacks de transiciones antiguas para que una reapertura no sea desmontada por un cierre ya obsoleto.

Los paneles fullscreen que deben cubrir el drawer tienen que renderizarse en una capa raíz posterior al drawer. Un `zIndex` alto dentro del árbol de Tabs no puede superar a un hermano global posterior. Si el panel usa contextos de Tabs (por ejemplo, visibilidad de la barra inferior), subir el proveedor compartido por encima de ambos árboles en vez de crear una segunda instancia.

Durante el cierre del drawer, no desmontar capas transparentes ni quitar sombra/elevación antes de que termine el `translateX`: ese cambio de composición produce un flash del fondo. Mantener estable el árbol y rasterizar la vista animada en una sola textura.