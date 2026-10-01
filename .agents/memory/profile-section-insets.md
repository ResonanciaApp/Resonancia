---
name: Márgenes verticales de Perfil
description: Regla del usuario para las distancias interiores de todas las secciones de Perfil.
---

Todas las secciones de Perfil deben tener 15 px desde el borde superior hasta el título o primer contenido, y 15 px desde el último contenido hasta el borde inferior. La separación exterior entre secciones es independiente.

**Why:** El 2026-10-01 el usuario pidió aplicar esta regla de manera permanente a Usuario, Esta semana, Historial de rachas, Intención, Calendario, Historial y Descargas, y comprobar los espacios internos, no solo el padding del contenedor.

**How to apply:** Auditar también el centrado, los tamaños mínimos, las transformaciones y los paddings de hijos: pueden sumar espacio aunque la tarjeta tenga padding 15. Incluir estados vacíos y con contenido. En componentes compartidos, usar una opción exclusiva de Perfil para no modificar otras pantallas.