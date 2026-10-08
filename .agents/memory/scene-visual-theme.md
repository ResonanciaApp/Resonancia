---
name: Temas visuales y escenas sonoras
description: Selector minimalista de temas en el drawer y separación entre tema visual y audio.
---

El usuario reemplazó el selector de ajustes por opciones minimalistas en el drawer: Día representa Cloudy y Noche representa Índigo 2, no dos niveles de brillo. Solo icono y título, con el mismo tamaño que las filas del menú; sin banners, imágenes, descripciones ni check. Día seleccionado colorea el sol dorado; Noche seleccionada colorea la luna morada suave; el icono y el texto de la opción no seleccionada deben ser #A8A8A8. Mantener crossfade y háptica suave extendida. La escena sonora sigue siendo independiente; la preferencia visual se conserva localmente y los sólidos mantienen contraste con texto claro.

El selector incluye también Natural (árbol, copia visual de Cloudy con el degradado de Respiración del drawer) y Pleyades (diamante, copia visual de Índigo 2 con la paleta del antiguo Andrómeda). Mantener dos columnas: Natural a la derecha de Día y Pleyades a la derecha de Noche, sin aumentar el número de filas. La paleta de Andrómeda fue confirmada por el usuario mediante captura y colores HEX; no confundirla con el parecido tema Universo.

**Why:** El usuario amplió explícitamente el selector con dos temas adicionales, cada uno basado en un tema existente; no pidió reemplazar Día o Noche.

**How to apply:** Heredar las reglas de superficies y controles del tema base, no solo registrar un nuevo degradado. Mantener independientes la selección visual y el audio, y no sustituir la paleta antigua solicitada por una nueva inventada.

Natural y Pleyades tienen excepciones explícitas para los botones Continuar de
Vuelve a ti en Dormir y Empezar sesión del temporizador Ambiental: fondo blanco,
texto e icono verde oscuro en Natural y azul marino oscuro en Pleyades.
El recordatorio matinal conserva sus colores. La barra horizontal de Natural
usa vidrio y elementos inactivos tintados de verde, con la misma transparencia;
el miniplayer del Mezclador no se recolorea con este ajuste.

**Why:** El usuario pidió estas diferencias de contraste y tinte después de crear
las copias de Cloudy e Índigo 2, sin cambiar los otros temas.

**How to apply:** Evaluar la identidad real del tema para estas excepciones,
no la identidad de la familia heredada. Mantener el cambio de la barra acotado
a su capa de vidrio y respetar la opacidad compartida.

En Natural, los acentos degradados de Mi rutina expansiva y su calendario son
dorados, no el morado heredado de Cloudy. El + del widget de Inicio tiene un
fondo verde uniforme, no un degradado visible; es independiente del dorado de
rutina y calendario.

**Why:** El usuario pidió distinguir estos elementos de Natural sin recolorear
Cloudy ni los otros temas.

**How to apply:** Mantener esta excepción en todas las superficies compartidas
de rutina, incluidos los estados completados y controles de añadir; conservar
su geometría y comportamiento.

**Why:** El 2026-10-04 trasladó Escenas al drawer y luego pidió sustituir las tarjetas ilustradas por sol/luna con títulos Día/Noche y selección mediante color. Posteriormente fijó explícitamente #A8A8A8 tanto para el icono como para el texto de la opción inactiva. Esta dirección reemplaza los banners luminosos con check, sin autorizar cambios de paleta ni audio.

La luna debe ser la misma silueta del banner del Mezclador de sonidos en Sonidos, no el glifo lunar de la fuente de iconos. La separación del título Escena a Día sigue el ritmo de los menús del drawer. El espacio ampliado antes de la línea de Escena es deliberado: al desplazarla, su título y las opciones Día/Noche deben acompañarla en el flujo, sin mover los menús anteriores.

**Why:** El usuario corrigió explícitamente la silueta y alineación de la luna y pidió estos espacios para el drawer.

**How to apply:** Conservar estas elecciones en el drawer; no trasladar ese margen adicional a otras secciones ni modificar el banner original al ajustar el selector.

**How to apply:** No restituir el selector de ajustes ni interpretar Día como un modo claro genérico. No reintroducir Universo ni Cloudy 2 como tarjetas sin petición. Retirar opciones no autoriza borrar preferencias o forzar un tema. Transicionar solo superficies de fondo, no textos ni contenido editorial. La háptica extendida de estas tarjetas no modifica la regla de un solo Soft del tab bar; no prometer duración continua exacta con una API de impactos discretos.

Universo conserva un respaldo sólido oscuro al sustituir su degradado por una
paleta más luminosa; no copiar automáticamente el primer stop al fondo sólido.

**Why:** Los colores de una referencia de degradado no definen necesariamente las
superficies sólidas, que muestran texto claro y necesitan mantener su contraste.
Índigo 2 tiene su propia regla y no debe homogeneizarse por este cambio.

**How to apply:** Aplicar las paletas de referencia al degradado compartido y
conservar el sólido, los acentos y las excepciones editoriales salvo petición
explícita. Mantener el aclarado de Luz separado de la paleta base de Noche.

Cloudy y Cloudy 2 heredan las reglas de superficies, acentos y presentación de Índigo 2,
pero cada uno usa los colores exactos de su propia referencia. No convertirlos en una
escena sonora ni aplicarle el aclarado histórico de la paleta de Índigo 2.

**Why:** La petición fue copiar el tema y sustituir su degradado, no recolorear
la referencia ni añadir audio.

**How to apply:** Tratar los tres como una familia visual para las excepciones de
estilo, conservando la identidad, la selección persistida y el degradado propio.

Los ajustes pedidos como «4 % más de saturación y 2 % más de contraste» se refieren
a Índigo 2, no a Dormir (el usuario corrigió ese nombre). Se aplican a sus fondos,
sin modificar Cloudy, Cloudy 2, Universo ni los acentos.

**Why:** El usuario aclaró el tema destinatario después de mencionar Dormir.

**How to apply:** Mantener la modificación acotada a la paleta de Índigo 2;
no propagarla a otros temas que comparten sus reglas visuales.