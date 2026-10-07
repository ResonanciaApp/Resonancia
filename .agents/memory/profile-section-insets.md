---
name: Márgenes verticales de Perfil
description: Regla del usuario para las distancias interiores de todas las secciones de Perfil.
---

Todas las secciones de Perfil deben tener 18 px desde el borde superior hasta el título o primer contenido, y 18 px desde el último contenido hasta el borde inferior. La sección de Usuario con avatar es la única excepción: 20 px arriba y abajo. La separación exterior entre secciones es independiente.

**Why:** El 2026-10-01 el usuario amplió la regla anterior de 15 px a 18 px para Esta semana, Historial de rachas, Intención, Calendario, Historial y Descargas; pidió 20 px para Usuario. Su última indicación de 18 px reemplaza la propuesta previa de 17 px.

**How to apply:** Auditar también el centrado, los tamaños mínimos, las transformaciones y los paddings de hijos: pueden sumar espacio aunque la tarjeta tenga el padding correcto. Incluir estados vacíos y con contenido. En componentes compartidos, usar una opción exclusiva de Perfil para no modificar otras pantallas.

Los desplazamientos verticales solicitados en Perfil, tanto del bloque de avatar y usuario como del historial de rachas, deben desplazar también todo el contenido posterior, conservando las separaciones entre secciones, salvo una instrucción explícita de «no empujes».

**Why:** El usuario aclaró «hacia abajo y empuja todo» para el avatar y repitió «empuja todo» para los siete días de racha; no quería desplazamientos visuales aislados. Después pidió «arrastra todas» hacia arriba. Para el bloque de siete días sin título ni fondo, distinguió después dos ajustes: subir 15 px arrastrando y bajar 10 px sin empujar.

**How to apply:** Usar el flujo normal para «arrastra» o «empuja». Aplicar solo a la sección indicada una compensación visual cuando diga «no empujes», sin trasladarla al contenido posterior. Consultar la regla específica de los siete días en las notas de progreso de Perfil.

En Perfil, Mi muro expansivo y Mi rutina expansiva conservan la misma separación exterior entre sí y respecto del último módulo de progreso, independientemente de su orden.

**Why:** El usuario pidió usar la distancia entre Mi rutina y el muro como referencia para separarlas del progreso. Intercambiar el orden de esas secciones no implica cambiar sus separaciones.

**How to apply:** Usar la distancia exterior real entre Tu camino y la primera de estas dos secciones como referencia para separarlas entre sí. Contar los márgenes de sus contenedores, no solo el margen superior de cada sección. Mantener los ajustes exclusivos de Perfil.

Los espacios adicionales del banner de Intención son exclusivos de Perfil: separar la descripción 4 px más del título y añadir 4 px arriba y abajo.

**Why:** El usuario pidió estos ajustes de espaciado por separado de los cambios de ilustración. La dirección visual vigente de las imágenes está documentada en las notas de Tu camino.

**How to apply:** Mantener esos ajustes propios de Perfil al reemplazar las imágenes, sin propagarlos a las filas del recorrido.