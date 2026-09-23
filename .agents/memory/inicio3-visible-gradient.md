---
name: Degradado visible en Inicio 3
description: Restricción visual para degradados locales de Inicio 3 debajo del hero.
---

Un degradado con tres colores equidistantes no garantiza que los tres se vean en Inicio 3: el hero ocupa gran parte del centro de la pantalla y puede tapar el tono intermedio. Para colores cercanos, dar al intermedio una franja propia en la parte descubierta, manteniendo transiciones suaves entre franjas.

**Why:** Tras añadir los tres tonos solicitados, el usuario seguía percibiendo solo dos; verificar la cantidad de stops en el código no equivale a verificar su visibilidad.

**How to apply:** Al ajustar fondos de Inicio 3, calcular dónde cae cada tono respecto del hero y la barra inferior en un viewport real. Mantener overrides locales al tema y variante solicitados: el tema global sirve también de referencia para otras pantallas.