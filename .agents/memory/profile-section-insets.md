---
name: Márgenes verticales de Perfil
description: Regla del usuario para las distancias interiores de todas las secciones de Perfil.
---

Todas las secciones de Perfil deben tener 18 px desde el borde superior hasta el título o primer contenido, y 18 px desde el último contenido hasta el borde inferior. La sección de Usuario con avatar es la única excepción: 20 px arriba y abajo. La separación exterior entre secciones es independiente.

**Why:** El 2026-10-01 el usuario amplió la regla anterior de 15 px a 18 px para Esta semana, Historial de rachas, Intención, Calendario, Historial y Descargas; pidió 20 px para Usuario. Su última indicación de 18 px reemplaza la propuesta previa de 17 px.

**How to apply:** Auditar también el centrado, los tamaños mínimos, las transformaciones y los paddings de hijos: pueden sumar espacio aunque la tarjeta tenga el padding correcto. Incluir estados vacíos y con contenido. En componentes compartidos, usar una opción exclusiva de Perfil para no modificar otras pantallas.

Los desplazamientos verticales del bloque de avatar y usuario deben desplazar también todo el contenido posterior, conservando las separaciones entre secciones.

**Why:** El usuario aclaró «hacia abajo y empuja todo» al solicitar mover este bloque; no quería un desplazamiento visual aislado.

**How to apply:** Ajustar su posición en el flujo normal, no mediante una transformación que deje las secciones siguientes en el mismo lugar.

El banner de Intención en Perfil tiene una excepción deliberada: su fondo se recorta simétricamente sin reducir el espacio ocupado entre secciones. La píldora va encima del título Intención; píldora, título y descripción forman un conjunto centrado verticalmente junto a la imagen y el chevron.

**Why:** El usuario pidió reducir únicamente el alto del fondo y alinear el conjunto. Su última indicación coloca la píldora encima del título, reemplazando la disposición horizontal sin cambiar el resto de la tarjeta.

**How to apply:** No normalizar de nuevo este banner a los márgenes generales ni propagar sus ajustes al camino de crecimiento o a otras portadas de Intención. Mantener el chevron a la derecha del conjunto completo, no solo del título.