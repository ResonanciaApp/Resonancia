---
name: Rendimiento del drag de Mi Rutina
description: Reglas para evitar degradación progresiva al completar y reordenar actividades.
---

En Mi Rutina, las transiciones de posición deben iniciarse únicamente cuando cambia el slot efectivo. No devolver una nueva animación desde cada reevaluación del estilo durante el gesto. Las filas y sus gestos deben conservar identidad cuando sus datos no cambian.

**Why:** Todas las filas comparten el estado del drag. Reiniciar transiciones y reconstruir cada gesto al actualizar una sola actividad multiplica el trabajo en el hilo UI y degrada el scroll después de uso repetido.

**How to apply:** Mantener la posición asentada en un valor compartido actualizado por reacción, estabilizar callbacks, memoizar filas y gestos, y limpiar timers/estados transitorios al perder foco. Agrupar también las escrituras locales rápidas.