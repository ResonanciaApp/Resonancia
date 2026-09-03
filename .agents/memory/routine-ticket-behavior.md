---
name: Mi Rutina ticket behavior
description: Visual state and timing chosen for the completion ticket in routine activity cards.
---

Las tareas pendientes de Mi Rutina muestran el ticket activo. Solo tocar el ticket completa
la tarea; tocar el resto de la card abre el detalle. Al completar, la card cambia
inmediatamente a teal, guarda la fecha en el historial y permanece 1 segundo antes de
desaparecer de Inicio.

**Why:** El usuario distinguió explícitamente entre leer la tarea y completarla, y pidió un
feedback teal breve antes de retirar la tarea pendiente sin perder su registro histórico.

**How to apply:** Mantener el historial persistido separado del estado visual transitorio de
salida. No hacer que toda la card complete, no volver a mostrar completadas en Inicio y no
ligar el segundo de permanencia a la duración del popup.