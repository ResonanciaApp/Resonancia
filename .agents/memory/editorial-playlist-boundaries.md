---
name: Límites de playlists editoriales
description: Separación deliberada entre curaduría de Resonancia y playlists privadas, y publicación por pantalla.
---

Las playlists editoriales y privadas deben conservar identidades separadas. Guardar una selección editorial es guardar una referencia, no copiarla a una playlist privada editable.

**Why:** El usuario necesita administrar selecciones desde Admin y actualizarlas en Descubrir/Dormir sin perder el control editorial ni modificar las playlists personales.

**How to apply:** Publicar playlists mediante ubicaciones y orden independientes por pantalla. Las etiquetas siguen organizando sesiones de Dormir, no la publicación de playlists. El rediseño editorial no autoriza rediseñar el editor de playlists privadas.

Las cards del carrusel deben conservar el diseño previamente aprobado: portada con degradado, título y duración, y dos líneas grises debajo que representan la pila.

**Why:** El usuario aclaró que conectar playlists creadas en Admin significaba alimentar esas mismas cards, no sustituirlas por otra presentación.

**How to apply:** Mantener dimensiones, tipografía y tiras grises al cambiar la fuente de datos; el nuevo diseño de detalle no se extiende a las cards.

Las migraciones editoriales deben preservar el contenido efectivo visible, incluidos los fallbacks antiguos, pero no volver a publicarlo después de que el editor lo elimine u oculte.

**Why:** Importar solo las ubicaciones explícitas omite playlists que antes aparecían por compatibilidad con Inicio. Una corrección posterior que recrea defaults o rellena grupos ya editados invalida las decisiones del editor.

**How to apply:** Materializar fallbacks solo una vez, con orden idéntico al cliente anterior. Las correcciones posteriores requieren evidencia de que el grupo sigue intacto y nunca crean grupos ausentes. Probar ediciones y borrados anteriores a la primera ejecución, no solo después del marcador.

Las sesiones iniciadas desde una playlist editorial abren directamente el reproductor con la cola explícita; cerrar ese reproductor detiene el audio y devuelve a la playlist.

**Why:** Este flujo debe sentirse contenido dentro de la selección editorial: el avance ocurre en el mismo reproductor y la pantalla de playlist nunca queda con audio residual.

**How to apply:** Conservar el origen de playlist al navegar, omitir el detalle solo para ese origen y ejecutar una detención real también al cerrar con gesto o botón Atrás. Fuera de playlists, mantener la navegación normal.