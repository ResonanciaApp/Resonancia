---
name: Temas visuales y escenas sonoras
description: Selector reducido a Índigo 2/Cloudy y separación entre tema visual y audio.
---

El usuario reemplazó el selector de ajustes por opciones minimalistas en el drawer: Día representa Cloudy y Noche representa Índigo 2, no dos niveles de brillo. Solo icono y título, con el mismo tamaño que las filas del menú; sin banners, imágenes, descripciones ni check. Día seleccionado colorea el sol dorado; Noche seleccionada colorea la luna morada suave; el icono y el texto de la opción no seleccionada deben ser #BFBFBF. Mantener crossfade y háptica suave extendida. La escena sonora sigue siendo independiente; la preferencia visual se conserva localmente y los sólidos mantienen contraste con texto claro.

**Why:** El 2026-10-04 trasladó Escenas al drawer y luego pidió sustituir las tarjetas ilustradas por sol/luna con títulos Día/Noche y selección mediante color. Posteriormente fijó explícitamente #BFBFBF tanto para el icono como para el texto de la opción inactiva. Esta dirección reemplaza los banners luminosos con check, sin autorizar cambios de paleta ni audio.

La luna debe ser la misma silueta del banner del Mezclador de sonidos en Sonidos, no el glifo lunar de la fuente de iconos. La separación del título Escena a Día sigue la de Herramientas al Mezclador; el bloque de Escena tiene una separación extra de 60 px respecto a la primera versión minimalista.

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