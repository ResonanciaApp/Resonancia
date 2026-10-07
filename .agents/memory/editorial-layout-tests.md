---
name: Pruebas del orden editorial
description: Cómo distinguir una regresión de un supuesto de diseño antiguo en las pruebas de Descubrir.
---

Al reordenar una sección de Descubrir, conservar el orden vigente de las demás aunque una prueba antigua exija otra composición.

**Why:** Las pruebas de espaciado conservaban un orden editorial anterior y fallaban también por secciones que no se habían modificado. Hacer que la pantalla coincidiera con esas expectativas habría revertido cambios ajenos al pedido.

**How to apply:** Contrastar las expectativas con la pantalla actual y la instrucción del usuario. Actualizar solo las expectativas obsoletas, sin cambiar contenido o posiciones no solicitados para conseguir que pase la prueba.

Explora por objetivo, Conoce a los resonadores y Mezclas de la comunidad deben usar la misma distancia efectiva que las secciones superiores de Descubrir.

**Why:** El usuario reiteró que la referencia es el espaciado de arriba, no una separación propia de los módulos inferiores.

**How to apply:** Comparar el espacio completo entre contenidos, incluyendo márgenes y padding propios de los componentes. Una prueba que solo verifica el centrado del divisor puede aprobar una distancia distinta de la solicitada.
