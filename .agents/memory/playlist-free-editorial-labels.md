---
name: Etiquetas editoriales libres de playlists
description: Semántica compatible para etiquetas personalizadas y los valores históricos de playlists.
---

El tipo editorial de una playlist es texto libre de hasta 40 caracteres. Los valores históricos `meditative`, `relaxation` y `ritual` siguen mostrándose traducidos; cualquier otro valor se muestra literalmente. `none` continúa siendo el valor reservado que oculta el texto editorial, sea una píldora o una descripción.

**Why:** La administración necesita crear textos con nombres arbitrarios sin perder compatibilidad visual ni la semántica especial de no mostrar texto editorial.

**How to apply:** No volver a cerrar el contrato, el esquema o los tipos de Mobile a un enum. Cualquier nueva superficie que renderice la etiqueta debe traducir los slugs históricos, mostrar literalmente los personalizados y ocultar `none`.