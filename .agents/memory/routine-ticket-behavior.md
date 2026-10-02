---
name: Mi Rutina ticket behavior
description: Visual state and timing chosen for the completion ticket in routine activity cards.
---

Las tareas pendientes de Mi Rutina muestran el ticket activo. Solo tocar el ticket completa
la tarea; tocar el resto de la card abre el detalle. Al completar, la card cambia
inmediatamente a su estado visual confirmado, guarda la fecha en el historial y permanece brevemente antes de
desaparecer de Inicio.

**Why:** El usuario distinguió explícitamente entre leer la tarea y completarla, y pidió un
feedback visual breve antes de retirar la tarea pendiente sin perder su registro histórico.

**How to apply:** Mantener el historial persistido separado del estado visual transitorio de
salida. No hacer que toda la card complete, no volver a mostrar completadas en Inicio y no
ligar el tiempo de permanencia a la duración del popup.

Al regresar a Inicio después de añadir una actividad, la rutina debe tener su altura
definitiva sin una transición estructural; la salida de «Rutina completa» hacia tareas
pendientes tampoco debe animar el alto.

**Why:** El usuario pidió retirar el desplazamiento vertical brusco que percibía al volver
desde «Añadir una actividad», no quitar los avisos ni la transición al completar tareas.

**How to apply:** Resolver inmediatamente los aumentos de altura y la vuelta a pendientes.
Conservar la animación de finalización y el parallax intencional de Inicio; no corregir este
retorno eliminando animaciones de navegación o del encabezado de forma global.

Los avisos «Actividad añadida» y «Actividad finalizada» coordinan su entrada y salida
con el widget emocional flotante entero: emoji, +, su fondo y el vidrio del widget.
El widget vuelve a aparecer durante la salida del aviso, no después de retirarlo.

**Why:** El usuario pidió explícitamente que las animaciones sucedieran al unísono.

**How to apply:** Iniciar los fades contrarios en las mismas fases de animación del
aviso, también en una interrupción; no sincronizarlos con un timeout independiente
ni únicamente con la desaparición del evento. Restaurar el widget al ocultar el aviso.

La salida de la última tarea y la entrada de «Rutina completa» deben formar una
transición del bloque entero, incluido el control inferior de añadir actividad.

**Why:** Retirar primero la tarea y el control inferior deja un intervalo vacío que
el usuario percibe como parpadeo; animar únicamente el mensaje final no lo resuelve.

**How to apply:** Coordinar la continuidad visual y el espacio ocupado sin posponer
el registro real de la tarea ni convertir la representación saliente en tareas pendientes.