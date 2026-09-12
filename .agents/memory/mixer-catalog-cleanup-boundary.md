---
name: Límite de limpieza del catálogo Mixer
description: Alcance confirmado al reiniciar el catálogo de sonidos sin destruir contenido administrado.
---

Los sonidos del Mezclador incluidos localmente en la app pueden retirarse al migrar a un catálogo administrado, pero los registros creados desde Admin y las sesiones Ambientales de prueba deben conservarse salvo autorización destructiva separada.

**Why:** El usuario confirmó explícitamente que los sonidos ya creados desde Admin debían permanecer, incluso durante una limpieza cuyo objetivo era retirar placeholders y recursos locales.

**How to apply:** Al limpiar o reiniciar Sonidos Mixer, separar siempre bundle local, registros de Admin y sesiones Ambientales. No inferir por nombres de prueba que un registro remoto se puede borrar.