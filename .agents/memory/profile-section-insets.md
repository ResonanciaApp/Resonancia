---
name: Márgenes verticales de Perfil
description: Regla del usuario para las distancias interiores de todas las secciones de Perfil.
---

Las secciones de Perfil tienen 18 px desde el borde superior hasta el título o primer contenido, y 18 px desde el último contenido hasta el borde inferior. Usuario conserva 20 px arriba y abajo. La fila semanal es ahora una excepción sin fondo ni título: el borde exterior del avatar queda a 35 px de los siete círculos, sin sumar un inset superior adicional.

**Why:** El usuario definió 18 px para las secciones y 20 px para Usuario; posteriormente pidió ocultar el banner de membresía, quitar el fondo semanal y fijar 35 px desde el avatar hasta los siete días. Esa distancia reemplaza la regla superior de 18 px solo para la fila semanal.

**How to apply:** Auditar también el centrado, los tamaños mínimos, las transformaciones y los paddings de hijos: pueden sumar espacio aunque la tarjeta tenga el padding correcto. Incluir estados vacíos y con contenido. En componentes compartidos, usar una opción exclusiva de Perfil para no modificar otras pantallas.

Perfil no muestra el divisor horizontal entre las dos filas de cifras de racha; no reservar un separador vacío ni retirar las cifras.

**Why:** El usuario pidió eliminar la línea, reemplazando el ajuste anterior de subirla ligeramente.

**How to apply:** Conservar los divisores de otras superficies compartidas y las estadísticas; esta excepción pertenece solo a Perfil.