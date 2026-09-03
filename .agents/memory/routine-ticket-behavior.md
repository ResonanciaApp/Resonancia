---
name: Mi Rutina ticket behavior
description: Visual state and timing chosen for the completion ticket in routine activity cards.
---

Mi Rutina usa intencionalmente un indicador visual invertido: una actividad no completada
muestra el ticket teal activo. Al tocarlo, la actividad se completa y el ticket permanece
visible durante el popup “Actividad finalizada” y 2 segundos adicionales; después se oculta.
La finalización persistida sigue siendo la fuente de verdad para el estado de actividad.

**Why:** La decisión busca que el ticket sea visible y accionable por defecto, sin perder el
feedback de finalización ni la animación de la card.

**How to apply:** Mantener la separación entre `completedDates` (estado persistido) y el
estado visual temporal del ticket. Si se cambia la duración del popup, ajustar también el
retraso para conservar los 2 segundos posteriores al cierre.