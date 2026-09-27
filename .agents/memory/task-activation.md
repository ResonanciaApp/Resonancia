---
name: Activación de tareas propuestas
description: Diferencia entre ejecutar una solicitud en Build y tener una tarea de proyecto asignada para cerrarla.
---

Una instrucción directa en Build para ejecutar una tarea que todavía está en Borradores permite hacer el trabajo, pero no cambia por sí sola su estado a tarea principal en progreso. El cierre de tareas rechaza esa situación.

**Why:** Se implementó una solicitud tras cambiar a Build y recibir la orden explícita de ejecutarla, pero el registro continuó en Borradores y el cierre respondió que no había tarea activa.

**How to apply:** Antes de prometer cerrar una tarea específica, comprobar si está asignada y activa. Si ya se implementó mientras aún era borrador, explicar al usuario que debe activarla/asignarla desde Tareas antes de registrar el cierre; no afirmar que el registro quedó completo.