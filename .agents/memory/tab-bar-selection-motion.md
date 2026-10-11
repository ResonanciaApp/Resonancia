---
name: Selección animada del tab bar
description: Por qué el selector sigue la navegación confirmada y conserva su movimiento al cambiar de destino.
---

El selector debe responder a la ruta activa confirmada, no adelantarse al tap.
Las rutas ocultas y los overlays conservan la última pestaña real seleccionada.

**Why:** un tap puede cerrar un overlay o ser cancelado por navegación. Mover
el selector antes de confirmar el destino puede indicar una pantalla que no
se abrió.

**How to apply:** mantener una sola posición animada en el hilo UI; un cambio
rápido de destino continúa desde su posición actual. El rebote aumenta con la
distancia que aún debe recorrer, no con un salto desde la posición del tab
anterior. No reiniciar el selector ni añadir otra animación horizontal.
