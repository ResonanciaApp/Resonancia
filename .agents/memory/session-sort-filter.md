---
name: Session sort/filter en pantallas de categoría
description: Filtro dinámico de orden (título cambiante) en Ancestrales/Música/Meditaciones y de dónde sale el dato de cada orden
---

Las listas de sesiones en las pantallas de categoría (Ancestrales, Música, Meditaciones) usan un orden dinámico con título cambiante en vez de las viejas secciones fijas "Escuchado Recientemente" + "Recientes".

Opciones del filtro y su fuente de datos:
- **Últimas subidas** / default ("Todas las sesiones") → orden por `parseInt(id)` desc (local, real).
- **Más escuchadas** → ranking REAL del endpoint `GET /catalog/popular` (cuenta reproducciones en `playback_history` de la DB). El historial LOCAL del cliente está deduplicado (1 entrada por sesión) y NO sirve para contar; siempre usar el endpoint.
- **Las mejores puntuadas** → valoraciones LOCALES del propio usuario (`@resonance_ratings`), NO un promedio global. El promedio real está pendiente de backend (ver backlog en replit.md).

**Limitación de "más escuchadas":** `/catalog/popular` hace join contra `catalog_sessions` (status published), así que sesiones solo bundleadas (no presentes en la DB) nunca aparecen en el ranking y caen al final (rank Infinity → fallback id desc). Aceptable: es la única fuente real de reproducciones.

**Por qué:** el usuario pidió 3 filtros que ordenen "de forma real". Dos de los tres dependen de datos del servidor/locales con estas salvedades; documentarlo evita prometer un promedio global de rating que aún no existe.
