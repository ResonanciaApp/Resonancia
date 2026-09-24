---
name: Drizzle push y datos de Inspiraciones
description: Riesgo de truncamiento al sincronizar esquema de desarrollo con Drizzle.
---

No ejecutar `push-force` cuando `drizzle-kit push` advierta que puede truncar Inspiraciones por la restricción única de fecha. Si un cambio no relacionado necesita esquema en desarrollo, aplicar solamente los cambios comprobados y no destructivos, y revisar la deriva de Inspiraciones por separado.

**Why:** Al agregar categorías de reflexiones, el push de desarrollo se detuvo en un prompt ajeno sobre 15 inspiraciones y ofreció vaciar la tabla. Forzarlo arriesgaría contenido editorial existente.

**How to apply:** Antes de un próximo push general, investigar el conflicto de unicidad de Inspiraciones sin borrar registros; no confundir esta advertencia con la migración que motivó el push. Producción sigue el flujo de publicación, nunca un push manual.