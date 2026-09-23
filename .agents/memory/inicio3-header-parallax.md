---
name: Backdrop fijo de Inicio 3
description: Dirección confirmada para la relación entre header, hero y contenido desplazable de Inicio 3.
---

El header y el hero de Inicio 3 quedan fijos como backdrop mientras las secciones se desplazan por delante. El degradado superior termina justo debajo del hero; el contenido inferior usa su color final.

**Why:** Antes se había confirmado un parallax de 0,52 para avatar, acciones y fila semanal, pero después el usuario pidió explícitamente que el header y el hero quedaran fijos detrás del contenido y confirmó esa interpretación. Esta decisión reemplaza la anterior.

**How to apply:** Los cambios de layout en Inicio 3 deben preservar el fondo fijo y la interactividad del hero y sus controles; no reintroducir desplazamiento parallax del header por el recuerdo de la decisión anterior. Evitar máscaras animadas al hacer scroll y rasterización forzada, que ya habían generado lag bajo Fabric.