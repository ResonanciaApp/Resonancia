---
name: Temas visuales y escenas sonoras
description: Los cuatro temas visuales, la familia Índigo 2/Cloudy y la separación de audio y Luz/Noche.
---

El tema visual de la app móvil se elige entre Universo (predeterminado), Índigo 2, Cloudy y Cloudy 2 mediante muestras de color en Escenas, tanto en Configuraciones como en Configuración y ajustes. La elección de una escena sonora no debe cambiar el aspecto visual. Luz y Noche solo alteran los colores de fondo del tema elegido: Noche conserva los tonos originales y Luz los mezcla una única vez con blanco al 3,5 %. La preferencia visual se conserva localmente y se resuelve antes de mostrar la app. Si el degradado acaba en un color muy claro, el respaldo sólido debe seguir oscuro.

**Why:** El usuario separó los temas visuales de las escenas sonoras y añadió Cloudy y Cloudy 2 como copias visuales de Índigo 2 con sus propios degradados. Cambiar la escena de audio no debe cambiar el fondo. Algunas superficies sin degradado muestran texto claro, así que un sólido de respaldo pálido quitaría legibilidad. La implementación previa de «modo brillante» combinaba cambios de saturación/luminosidad con un overlay adicional; acumular esos efectos no representaba un único aumento controlado. Posteriormente pidió reducir el aclarado de Luz de 7 % a 3,5 %.

**How to apply:** Si se añade una pantalla u hoja temática, consumir la paleta visual compartida para su fondo; no inferir el tema desde la escena de audio ni añadir otros temas seleccionables sin pedirlo. Si cambia el degradado a uno de extremo claro, verificar por separado la legibilidad del color sólido de respaldo. No aclarar textos, iconos ni imágenes editoriales mediante un overlay de pantalla completa. Los fondos de marca explícitos son excepciones editoriales, no otros temas seleccionables.

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