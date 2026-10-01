---
name: Márgenes verticales de Perfil
description: Regla del usuario para las distancias interiores de todas las secciones de Perfil.
---

Todas las secciones de Perfil deben tener 18 px desde el borde superior hasta el título o primer contenido, y 18 px desde el último contenido hasta el borde inferior. La sección de Usuario con avatar es la única excepción: 20 px arriba y abajo. La separación exterior entre secciones es independiente.

**Why:** El 2026-10-01 el usuario amplió la regla anterior de 15 px a 18 px para Esta semana, Historial de rachas, Intención, Calendario, Historial y Descargas; pidió 20 px para Usuario. Su última indicación de 18 px reemplaza la propuesta previa de 17 px.

**How to apply:** Auditar también el centrado, los tamaños mínimos, las transformaciones y los paddings de hijos: pueden sumar espacio aunque la tarjeta tenga el padding correcto. Incluir estados vacíos y con contenido. En componentes compartidos, usar una opción exclusiva de Perfil para no modificar otras pantallas.