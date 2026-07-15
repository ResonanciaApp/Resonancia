---
name: Catalog create vs edit field parity
description: Create INSERT and edit PATCH of catalog submissions enumerate fields separately — omissions drop data silently
---

La ruta de creación de sesiones del catálogo (POST submissions) enumera manualmente cada columna en el INSERT, y la ruta de edición (PATCH) enumera cada campo por separado en su handler. No comparten mapeo.

**Why:** themeTag se perdía silenciosamente al CREAR una sesión (el INSERT lo omitía) mientras que EDITAR funcionaba — zod aceptaba el campo, el server lo descartaba sin error. Síntoma confuso: "funciona al editar pero no al crear".

**How to apply:** al agregar un campo nuevo a las sesiones del catálogo, tocar en lockstep: schema OpenAPI (create + edit bodies), INSERT de creación, handler de edición (`if (data.X !== undefined)`), y serializer. Comparar campo por campo el body zod contra los values del INSERT. Nota: EditSubmissionBody hoy no cubre descansoTag/sonidosTag/podcastTag/sabiduriaTag/frequency/guideId/artistId (no editables post-creación) y sus `.default(false)` en skipDetail/skipMiniPlayer resetean si el PATCH los omite.
