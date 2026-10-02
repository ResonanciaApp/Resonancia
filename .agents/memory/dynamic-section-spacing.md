---
name: Separación tras contenido dinámico
description: Evita solapamientos transitorios entre secciones cuando una cambia de altura al terminar una animación.
---

Cuando una sección de Inicio sustituye contenido al terminar una animación, el espacio vertical que la separa de la sección siguiente debe pertenecer al contenedor estable de la sección siguiente. Si la superficie saliente cambia entre altura animada, contenido absoluto y una card final, fijar el gap como margen, padding o spacer dentro de esa superficie puede quedar temporalmente fuera de la medición de layout en iOS.

**Why:** Al completar la última actividad de Mi rutina, la separación interna de 53 px se ignoraba durante la actualización en vivo y “Frase del día” se montaba sobre la card final. Al remontar la pantalla, la medición volvía a ser correcta.

**How to apply:** Para transiciones equivalentes, coloca el gap como padding superior de un wrapper estable alrededor de la sección siguiente. Además, cuando una lista absoluta se sustituye por una card final, conserva un wrapper de layout montado alrededor de ambas ramas y dale el `minHeight` de la card final al activar ese estado; la animación de opacidad debe vivir dentro. No fijes la altura del contenido para corregir el gap.

Al volver de una altura animada a layout natural en Reanimated, limpiar explícitamente
la dimensión con `height: undefined`; devolver `{}` no retira la altura aplicada al
nodo nativo.

**Why:** La rutina podía crecer dentro de una altura nativa retenida de su estado
completado. El botón bajaba, pero la línea y la frase posteriores no reservaban ese
espacio y quedaban detrás de las nuevas cards. Las pruebas que solo leían `.height`
no distinguían entre omitir la propiedad y eliminarla explícitamente.

**How to apply:** Verificar la transición desde un estado con dimensión fija hacia
contenido variable, incluidos varios aumentos y un segundo ciclo de completado.
Las pruebas deben modelar que el nodo nativo conserva las propiedades omitidas.

Retirar las líneas decorativas entre secciones de Inicio o Descubrir no implica eliminar el
espacio que reservaban. Conservar el gap anterior como espacio transparente y
sumar la separación extra solicitada desde el bloque indicado: «Para este momento»
en Inicio y los seis bloques de categorías en Descubrir.

**Why:** El usuario pidió quitar las líneas y aumentar la separación a la vez;
colapsar su espacio produciría el resultado contrario.

**How to apply:** Comparar la suma de márgenes y altura del separador anterior con
el espacio nuevo. Mantener sin cambios la separación anterior a ese bloque y la
tipografía interna de las cards al ajustar solo títulos de sección.