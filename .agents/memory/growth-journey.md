---
name: Camino de crecimiento
description: Criterio de progreso y tratamiento visual acordados para la línea de tiempo botánica de Tu progreso.
---

Los niveles del camino dependen del total de días **activos acumulados**, no de la racha actual ni de la mayor racha. Un nivel alcanzado no retrocede cuando se corta una racha. Las ocho imágenes deben tener bordes con transparencia radial para fundirse con el fondo real; no sustituirlas por fotos rectangulares opacas.

**Why:** El usuario escogió explícitamente los días acumulados aunque no sean consecutivos entre tres opciones, y pidió que las plantas parecieran emerger del ambiente, no ocho fotos pegadas.

**How to apply:** Al ampliar rangos o cambiar arte, mantener la métrica de días activos canónicos y el desvanecido alfa radial de los PNG (o un equivalente real en móvil) antes de integrarlos en la timeline.

La visibilidad de las ilustraciones no debe depender por completo de un callback de scroll ni arrancar desde opacidad cero en iOS. El movimiento de entrada puede añadir un matiz, pero el arte local debe mostrarse incluso si ese callback se retrasa.

**Why:** El usuario vio la línea de tiempo sin imágenes en su iPhone aunque la vista web sí las mostraba; un contenido esencial no debe quedar oculto por la animación.

**How to apply:** Mantener una opacidad base visible y preferir el cargador nativo para PNG locales del recorrido. Si vuelve a faltar arte en un dispositivo, comprobar eventos de error de carga antes de atribuirlo al diseño.