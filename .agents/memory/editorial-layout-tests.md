---
name: Pruebas del orden editorial
description: Cómo distinguir una regresión de un supuesto de diseño antiguo en las pruebas de Descubrir.
---

Al reordenar una sección de Descubrir, conservar el orden vigente de las demás aunque una prueba antigua exija otra composición.

**Why:** Las pruebas de espaciado conservaban un orden editorial anterior y fallaban también por secciones que no se habían modificado. Hacer que la pantalla coincidiera con esas expectativas habría revertido cambios ajenos al pedido.

**How to apply:** Contrastar las expectativas con la pantalla actual y la instrucción del usuario. Actualizar solo las expectativas obsoletas, sin cambiar contenido o posiciones no solicitados para conseguir que pase la prueba.
