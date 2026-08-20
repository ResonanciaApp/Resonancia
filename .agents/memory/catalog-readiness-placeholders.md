---
name: Readiness editorial del catálogo
description: Regla de publicación para sesiones finales, placeholders y audios bundleados.
---

Las sesiones incompletas solo se publican como `isPlaceholder: true`: siguen visibles y alcanzan el reproductor, pero nunca reproducen ni omiten el reproductor compacto. Una sesión final publicada debe tener metadata esencial y una pista `main` o `base` reproducible.

Las fuentes remotas válidas son rutas de objetos o URLs HTTP(S). Los audios incluidos en la app usan el marcador `bundle:<sessionId>` y solo son válidos si el ID pertenece al manifiesto de bundles mantenido en servidor y móvil.

**Why:** inferir un placeholder por la falta de audio escondía contenido editorial válido; aceptar referencias vagas permitía publicar una experiencia con “Audio no disponible”.

**How to apply:** cualquier creación, publicación, edición o cambio de audio que afecte una sesión publicada debe validar el estado agregado resultante bajo bloqueo. Usar el preflight de catálogo antes de distribuir y actualizar los dos manifiestos de bundles conjuntamente cuando se agregue o retire un audio nativo.