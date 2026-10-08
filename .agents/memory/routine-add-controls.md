---
name: Dos controles Añadir actividad
description: Diferencia visual deliberada entre las dos acciones para añadir actividades en Mi rutina expansiva.
---

El bloque “Añadir una actividad” que aparece debajo de las cards conserva su diseño transparente con borde discontinuo blanco, icono blanco y texto blanco. La píldora que aparece dentro del estado vacío “Rutina completa” usa fondo blanco con icono y texto azul marino.

La card contenedora “Rutina completa / Hasta mañana” también es transparente y usa borde discontinuo; no lleva una superficie negra detrás.

Las cards de actividades de “Mi rutina expansiva” usan fondo negro al 16 %, independientemente de la escena. Conservar el degradado de celebración al completar.

**Why:** El usuario pidió ese fondo para las cards de actividades, no para el calendario, los controles de añadir ni el estado “Rutina completa”.

**How to apply:** Limitar esta superficie a las cards de actividades de Mi rutina expansiva; no propagarla a los tokens compartidos del calendario ni a los estados vacíos.

**Why:** El usuario pidió cambiar únicamente el color de la píldora del estado “Rutina completa”; aplicar ese tratamiento al bloque inferior fue una interpretación incorrecta.

**How to apply:** Tratar ambos controles y la card contenedora como piezas independientes. Los cambios solicitados para la píldora de “Rutina completa” no deben propagarse al bloque grande situado debajo de las actividades ni a su contenedor, y viceversa.

Mi rutina expansiva pertenece a Perfil, debajo de Mi muro expansivo, y no se muestra en Inicio. Las actividades y sus controles siguen disponibles en Perfil.

**Why:** El usuario pidió insertar la sección en Perfil y luego eliminarla explícitamente de Inicio, no borrar las actividades.

**How to apply:** Al modificar Inicio, no volver a montar allí la sección; al trabajar en Perfil, conservar el acceso funcional a la rutina.

En Perfil, la card inferior «Añadir una actividad» iguala la altura real de Mi muro expansivo cerrado, no la del formulario expandido. La píldora del estado Rutina completa conserva su diseño propio.

**Why:** El usuario pidió igualar las dos cards. Acoplar la card de rutina a la expansión del editor la agrandaría sin una relación funcional y movería contenido innecesariamente.

**How to apply:** Usar la medida colapsada, incluyendo cualquier cambio por ajuste de texto o escala de fuente; ignorar las alturas durante la expansión y sus animaciones. No trasladar esta regla a otros controles de añadir.

En Perfil, las cards de Mi rutina expansiva toman Mi muro como referencia, pero quedan dos píxeles más abajo del título: tareas, Añadir una actividad y Rutina completa.

**Why:** El usuario afinó la separación de las tres clases de card por igual. Comparar solo el margen del header ignora el margen adicional de la card y la altura de la línea del título.

**How to apply:** Igualar los marcos de los títulos y contar todos los márgenes hasta el borde. Conservar la separación entre la última actividad y Añadir cuando sí hay actividades.