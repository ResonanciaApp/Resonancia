---
name: Header de Inicio 3 no es sticky
description: Decisión visual sobre el desplazamiento del encabezado principal de Inicio 3.
---

En Inicio 3, el bloque de perfil/búsqueda y la fila semanal de racha deben desplazarse al mismo ritmo que el resto del hero. No deben quedarse retenidos ni moverse más lento para simular un sticky.

**Why:** El usuario pidió eliminar el sticky de Inicio; una compensación parcial del scroll seguía produciendo el mismo efecto incluso después de quitar el header absoluto.

**How to apply:** Al modificar el hero de Inicio 3, no aplicar traducciones positivas derivadas de `scrollY` a sus acciones ni a la fila de racha. El parallax de fondos puede mantenerse separado.