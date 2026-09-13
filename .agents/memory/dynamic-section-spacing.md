---
name: Separación tras contenido dinámico
description: Evita solapamientos transitorios entre secciones cuando una cambia de altura al terminar una animación.
---

Cuando una sección de Inicio sustituye contenido al terminar una animación, el espacio vertical que la separa de la sección siguiente debe pertenecer al contenedor estable de la sección siguiente. Si la superficie saliente cambia entre altura animada, contenido absoluto y una card final, fijar el gap como margen, padding o spacer dentro de esa superficie puede quedar temporalmente fuera de la medición de layout en iOS.

**Why:** Al completar la última actividad de Mi rutina, la separación interna de 53 px se ignoraba durante la actualización en vivo y “Frase del día” se montaba sobre la card final. Al remontar la pantalla, la medición volvía a ser correcta.

**How to apply:** Para transiciones equivalentes, coloca el gap como padding superior de un wrapper estable alrededor de la sección siguiente. Además, cuando una lista absoluta se sustituye por una card final, conserva un wrapper de layout montado alrededor de ambas ramas y dale el `minHeight` de la card final al activar ese estado; la animación de opacidad debe vivir dentro. No fijes la altura del contenido para corregir el gap.