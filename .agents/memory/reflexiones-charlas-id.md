---
name: Reflexiones conserva el ID charlas
description: Distinción entre la categoría editorial Reflexiones y las funciones personales de diario/reflexiones.
---

La categoría editorial visible se llama **Reflexiones**, pero conserva el ID técnico `charlas` para mantener sesiones, tags y filtros existentes. No crear ni restaurar una categoría de catálogo separada con ID `reflexiones`.

**Why:** el catálogo anterior llegó a tener rastros técnicos de `reflexiones`, mientras que la categoría activa y todos sus datos usan `charlas`. Además, la app tiene funciones personales de diario, historias y reflexiones que no pertenecen a esta categoría editorial.

**How to apply:** en textos visibles del Admin, API y Mobile usar “Reflexiones”. En comparaciones, persistencia, rutas de categoría, tags e imágenes conservar `charlas`. No borrar ni renombrar las funciones personales que usan “reflexiones”.

La fila legada `reflexiones` aún puede existir en la base de datos y contener sesiones publicadas. No tratar el retiro de la categoría visible como autorización para borrar esas filas: ocultar el contenido asociado de las superficies públicas hasta que el usuario decida si quiere reasignarlo.

**Why:** retirar una categoría editorial del código no equivale a consentir la pérdida irreversible de sesiones o de su historial.

**How to apply:** preservar los registros para revisión editorial; si se reasignan sesiones más adelante, conservar sus IDs y sus relaciones.