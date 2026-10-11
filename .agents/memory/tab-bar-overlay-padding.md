---
name: Tab bar overlay padding
description: La tab bar inferior de (tabs) es un overlay absoluto; las pantallas que llenan el alto deben despejarla manualmente
---

La barra inferior es un overlay y no empuja el contenido de las pantallas.

**Regla:** una pantalla que ancla contenido abajo debe reservar la altura
total del contenedor de navegación, incluida el área segura. Una píldora
flotante no significa que la reserva deba reducirse a su superficie visible.
Comprobar la geometría vigente antes de copiar una fórmula antigua.

**Why:** sin esta reserva el contenido del fondo queda cortado por la barra;
pasó en Geometrix. Al convertir la barra en píldora se conservó deliberadamente
la reserva existente para no cambiar la posición de otras pantallas y overlays.

**How to apply:** si cambia la altura total, sincronizar las reservas y anclajes
de las pantallas. Si solo cambia la forma visual, preservar esos espacios.
