---
name: Colecciones dinámicas de supercategorías
description: Reglas editoriales para crear, renombrar, borrar y mostrar colecciones de Dormir y Sonidos.
---

Las colecciones de Dormir y Sonidos pueden administrarse dinámicamente. Mobile combina las definiciones canónicas con las etiquetas presentes en sesiones hidratadas; las colecciones personalizadas reciben metadata visual genérica y solo aparecen cuando tienen contenido.

La taxonomía oficial de categorías editoriales del Admin es: Música, Meditaciones, Sonoterapia, Charlas, Historias y Ambientales. Dormir y Sonidos son supercategorías; Reflexiones es legado retirado. Los filtros deben usar IDs canónicos, no `categoryLabel` históricos como “Frecuencias”.

**Why:** Las colecciones ya representan pantallas internas, pero mantener una lista cerrada en código impedía que Admin creara nuevas pantallas sin una actualización de la app.

**How to apply:** Los renombres y bajas deben propagarse a los arrays de sesiones. Un array remoto vacío es autoritativo y no debe reconstruirse desde campos legacy. “Todos los sonidos” es una opción agregada del sistema: siempre debe permanecer protegida contra renombre y borrado.