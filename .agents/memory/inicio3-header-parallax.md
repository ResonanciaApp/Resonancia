---
name: Parallax del header de Inicio 3
description: Restricción visual para optimizaciones de rendimiento del hero de Inicio 3.
---

El avatar, las acciones laterales y la fila semanal de Inicio 3 deben conservar su desplazamiento lento y sincronizado respecto del scroll.

**Why:** El usuario confirmó que este parallax es intencional. No es el sticky header que pidió retirar; eliminar la compensación de scroll cambió el diseño equivocado.

**How to apply:** Al optimizar el hero, aislar renders de React y mantener el movimiento en el hilo de UI. No retirar el estilo compartido ni cambiar su factor sin una solicitud explícita.

El factor de compensación confirmado es `0.52`: el bloque se desplaza visualmente a cerca del 48% de la velocidad normal del contenido.

No animar una máscara (`MaskedView`) en respuesta al scroll del hero. Aunque el valor viva en el hilo de UI, la recomposición de la máscara puede trabar tanto el hero como las capas parallax. Preferir un degradado simple y rasterizar únicamente los bloques estáticos que se trasladan.