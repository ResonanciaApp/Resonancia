---
name: Caché del catálogo Mixer
description: Regla offline-first para evitar que las cards del Mezclador desaparezcan cuando la API no responde al arrancar.
---

El catálogo administrado sigue siendo la fuente autoritativa, pero Mobile debe hidratar primero el último snapshot válido y actualizarlo cuando recibe una respuesta válida de la API.

**Why:** El catálogo local está vacío por diseño. Si la API está detenida o falla durante un arranque frío, iniciar el contexto con una lista vacía hace desaparecer todas las cards aunque los registros sigan existiendo en la base de datos.

**How to apply:** Persistir los registros remotos con sus object paths, no las URLs absolutas resueltas. Una respuesta válida —incluso vacía— reemplaza el caché para respetar bajas reales; un error HTTP o de red conserva el último snapshot.