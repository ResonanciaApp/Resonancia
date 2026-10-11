---
name: Pruebas del layout vigente
description: Cómo distinguir regresiones de expectativas antiguas en las pruebas de Descubrir y Perfil.
---

Al reordenar una sección de Descubrir, conservar el orden vigente de las demás aunque una prueba antigua exija otra composición.

**Why:** Las pruebas de espaciado conservaban un orden editorial anterior y fallaban también por secciones que no se habían modificado. Hacer que la pantalla coincidiera con esas expectativas habría revertido cambios ajenos al pedido.

**How to apply:** Contrastar las expectativas con la pantalla actual y la instrucción del usuario. Actualizar solo las expectativas obsoletas, sin cambiar contenido o posiciones no solicitados para conseguir que pase la prueba.

En Perfil y Tu camino también hay expectativas históricas de tamaños, espaciado y estructura. Ante un fallo ajeno al cambio solicitado, contrastarlo con la versión anterior antes de modificar la UI.

**Why:** Algunas pruebas amplias ya fallaban antes de los ajustes de iconos y calendario. En Tu camino, las expectativas de las antiguas tarjetas altas de recompensas sobrevivieron al diseño compacto de candado y texto. También quedaron pruebas de avatares que suponían un bloqueo absoluto, anteriores a los desbloqueos ganados. Corregir el producto para satisfacerlas habría deshecho decisiones posteriores.

**How to apply:** Verificar el cambio con pruebas específicas y comparar los fallos generales contra la base anterior. Separar regresiones nuevas de fallos preexistentes; no declarar toda la suite aprobada si solo pasó el alcance específico.

Explora por objetivo, Conoce a los resonadores y Mezclas de la comunidad deben usar la misma distancia efectiva que las secciones superiores de Descubrir.

**Why:** El usuario reiteró que la referencia es el espaciado de arriba, no una separación propia de los módulos inferiores.

**How to apply:** Comparar el espacio completo entre contenidos, incluyendo márgenes y padding propios de los componentes. Una prueba que solo verifica el centrado del divisor puede aprobar una distancia distinta de la solicitada.

Mezclas de la comunidad queda oculta únicamente en Descubrir; sus datos y otras superficies se conservan. Nuevo en Resonancia va inmediatamente antes de las playlists editoriales, manteniendo la separación estándar.

**Why:** El usuario cambió expresamente esta distribución el 8 de octubre de 2026; sustituye la ubicación anterior de Nuevo debajo de los objetivos.

**How to apply:** No reintroducir el carrusel comunitario ni su separador huérfano en Descubrir para satisfacer pruebas del orden antiguo. Conservar el orden de las demás secciones.
