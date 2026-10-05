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

La sección antes llamada Intención en Perfil mantiene sus insets propios. Ahora se titula «Tu camino», con «Ver todo» al margen derecho del título, la píldora debajo y sin descripción ni chevron.

**Why:** El usuario reemplazó la jerarquía anterior y pidió que «Ver todo» sustituyera el chevron.

**How to apply:** Conservar el margen interior derecho del botón y centrar el texto junto a la imagen. No extender estos cambios a otras superficies de Intención.

La imagen de Perfil es cuadrada sin difuminado, con radio 21 y borde exterior blanco de 3 px al 25 %. Conserva el brillo extra del 4 % exclusivo de Perfil.

**Why:** El usuario sustituyó expresamente la imagen circular desvanecida por la portada cuadrada con borde exterior.

**How to apply:** Reservar espacio para el borde exterior sin recortarlo ni alterar los insets de la tarjeta. El timeline conserva su propio arte y brillo.