---
name: Separación tras contenido dinámico
description: Evita solapamientos transitorios entre secciones cuando una cambia de altura al terminar una animación.
---

Cuando una sección con contenido dinámico sustituye contenido al terminar una animación, el espacio vertical que la separa de la sección siguiente debe pertenecer al contenedor estable de la sección siguiente. Si la superficie saliente cambia entre altura animada, contenido absoluto y una card final, fijar el gap como margen, padding o spacer dentro de esa superficie puede quedar temporalmente fuera de la medición de layout en iOS.

**Why:** Al completar la última actividad de Mi rutina, la separación interna de 53 px se ignoraba durante la actualización en vivo y “Frase del día” se montaba sobre la card final. Al remontar la pantalla, la medición volvía a ser correcta.

**How to apply:** Para transiciones equivalentes, coloca el gap como padding superior de un wrapper estable alrededor de la sección siguiente. Además, cuando una lista absoluta se sustituye por una card final, conserva un wrapper de layout montado alrededor de ambas ramas y dale el `minHeight` de la card final al activar ese estado; la animación de opacidad debe vivir dentro. No fijes la altura del contenido para corregir el gap.

Cuando se elimina una sección completa, revisar si queda un espaciador pensado para separarla de la sección siguiente. Si la sección anterior ya aporta el espacio estándar, conservar ese espacio y retirar el espaciador huérfano.

**Why:** Al quitar Mi rutina expansiva de Inicio, Frase del día conservó un espaciador adicional encima del espacio ya reservado por Mis favoritos o Videos destacados y quedó demasiado abajo.

**How to apply:** Comparar la suma de márgenes y espaciadores en cada rama condicional (con o sin videos) antes de ajustar la siguiente sección; no retirar el espacio normal entre secciones.

En Inicio, Frase del día debe tener una separación equivalente antes y después, respecto de Videos destacados y Muro de agradecimiento.

**Why:** El usuario pidió aumentar y estandarizar ambos espacios porque percibía esas secciones demasiado juntas.

**How to apply:** Ajustar solo Inicio activo, conservar las variantes anteriores y comprobar también la rama sin videos. Contar el espacio ya aportado por el carrusel anterior antes de añadir padding; el divisor debe quedar centrado en el nuevo espacio.

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

Retirar las líneas decorativas entre secciones no implica eliminar el
espacio que reservaban. Conservar el gap anterior como espacio transparente y
sumar la separación extra solicitada desde el bloque indicado: «Para este momento»
en Inicio, los seis bloques de categorías en Descubrir y el primer carrusel en
Dormir y Sonidos, y también en categorías y sus secciones internas.
Los banners intercalados también conservan su separación.

**Why:** El usuario pidió quitar las líneas y aumentar la separación a la vez;
colapsar su espacio produciría el resultado contrario.

**How to apply:** Comparar la suma de márgenes y altura del separador anterior con
el espacio nuevo. Mantener sin cambios la separación anterior a ese bloque y la
tipografía interna de las cards al ajustar solo títulos de sección.
Las pantallas internas que muestran una sola cuadrícula no necesitan carruseles
nuevos para cumplir esta regla; mantener su estructura y sus títulos de página.

Las líneas divisoras entre secciones son visibles en Inicio 3, Descubrir, Dormir y Sonidos, centradas en el hueco ya existente sin añadir altura. En Inicio no debe haber línea encima de Para este momento ni debajo del Muro de agradecimiento. En Descubrir empiezan debajo de los seis bloques de categorías, no dentro de ellos.

**Why:** El usuario pidió restaurar las líneas en estas cuatro pantallas, ubicarlas justo a la mitad de cada separación y retirar expresamente dos de Inicio, después de haberlas quitado en una revisión anterior.

**How to apply:** Considerar el margen de la sección anterior y el de la siguiente al colocar una línea; atender a las ramas con o sin videos y a los bloques Premium. Mantener los gaps normales, incluida la eliminación del espacio duplicado sobre Frase del día.