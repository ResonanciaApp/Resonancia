---
name: Progreso visible en Perfil
description: Orden actual del progreso en Perfil y su relación con Tu progreso.
---

Perfil conserva la semana, el historial completo de cuatro cifras, Intención, el calendario y el historial de sesiones. Tu progreso muestra la semana en curso y sus sesiones completadas, sin historial de rachas ni tarjeta de Intención. Los tratamientos de ambas superficies son independientes.

**Why:** El usuario redefinió Tu progreso como seguimiento de la semana actual, mientras Perfil conserva el resumen y los accesos personales. Compartir componentes y datos no autoriza a propagar cambios visuales entre ambas pantallas.

**How to apply:** Configurar cada superficie por separado. En Perfil, conservar la separación uniforme entre sus tarjetas. En Tu progreso, filtrar completadas de lunes a domingo local; al cambiar de semana, renovar la vista sin borrar actividad histórica. Si no hay completadas visibles, ocultar separador, título y cards. No reintroducir «Mis estadísticas» en Perfil.

En Tu progreso, «cards horizontales» describe cada fila, no la dirección de la lista: van una debajo de otra, sin carrusel ni scroll propio.

**Why:** El usuario distinguió explícitamente el formato de la card del desplazamiento del conjunto.

**How to apply:** Mantener una columna dentro del scroll general de la pantalla; no introducir otro ScrollView para las completadas.

En Perfil, Intención conserva contenido y acceso a Tu camino, pero su tarjeta debe ser compacta y respetar la misma distancia entre borde y contenido que el historial de rachas.

**Why:** El usuario pidió reducir su altura y hacer coherentes los espacios interiores de ambas tarjetas, no reducir el arte ni cambiar el recorrido.

**How to apply:** Mantener los insets del historial como referencia para la tarjeta de Intención; no forzar una altura que introduzca espacio vacío adicional.

La píldora «0 Días: Intención» y la tarjeta de Intención de Perfil abren directamente la misma ventana canónica «Tu camino». El toque en la píldora no debe abrir Mi cuenta y usa el mismo feedback de reducción/rebote que actualizar recomendaciones de Inicio.

**Why:** El usuario pidió primero el acceso directo desde la identidad compacta y después añadir también la tarjeta de Tu progreso debajo del historial de rachas. Son dos entradas al mismo recorrido, no dos versiones independientes.

**How to apply:** Reutilizar la misma tarjeta y la ventana canónica del recorrido; al cerrar, conservar Perfil como pantalla de origen. La cifra sigue siendo una vista previa, no activar los niveles por estos accesos.

Descargas tiene su propio bloque inmediatamente debajo de Historial en Perfil. Su propósito es mostrar las copias guardadas en el dispositivo, no repetir lo escuchado o los favoritos.

**Why:** El usuario pidió recuperar ese espacio para las sesiones que descargue y conserve en la app; no pidió ejemplos ficticios ni un motor nuevo de descargas.

**How to apply:** Alimentar las cards con descargas locales completas del usuario actual y conservar un estado vacío claro mientras no existan.

«Mis estadísticas» pertenece a Configuración y ajustes, dentro de «Estadísticas personales», encima de «Personalizar notificaciones». Allí conserva sus minutos totales, días activos y filtro de período, sin añadir rachas ni calendario.

**Why:** El usuario retiró ese módulo de Perfil y eligió explícitamente su nueva ubicación en ajustes.

**How to apply:** Mantener el mismo cálculo y filtro del módulo compartido; no duplicarlo en Perfil ni mover allí los otros bloques de progreso.

El calendario de Perfil muestra junto a la fecha la cantidad de sesiones completadas de ese día, encima de las cards, solo cuando hay completadas. El texto usa el mismo color descriptivo que las cards de Mis favoritos en Inicio, no el acento de la fecha.

**Why:** El usuario pidió identificar la cantidad diaria antes de las sesiones y mantener coherencia visual con Mis favoritos.

**How to apply:** Conservar singular/plural, contar las sesiones del día seleccionado y no extender este resumen a otros calendarios sin solicitud.

En el historial de Perfil, «Racha actual» cuenta los días activos de la semana actual de lunes a domingo (0–7), aunque no sean consecutivos. «Rachas completadas» cuenta exclusivamente semanas calendario con sus siete días activos; siete días acumulados entre distintas semanas no forman una racha completada.

**Why:** El usuario definió esas cifras para Perfil; Inicio conserva su racha consecutiva. Tu progreso muestra los días de la semana, pero ya no presenta el historial completo.

**How to apply:** Usar los mismos días activos de los siete círculos. Unir semanas completas remotas y locales por su fecha de lunes, no sumar contadores ni limitar el historial a la retención móvil. Conservar el significado consecutivo de la racha actual en las demás superficies.

La etiqueta «Racha acumulada» y el loto dorado de Perfil son una vista previa de diseño: por ahora, la cifra conserva el cálculo anterior de la racha más larga; no convertirla aún en un total acumulado. Ambas cifras pueden coincidir durante esta vista previa.

**Why:** El usuario pidió explícitamente cambiar el diseño y el texto, pero dejar la funcionalidad intacta hasta una petición posterior.

**How to apply:** Conservar la etiqueta y el tratamiento del loto en Perfil sin alterar las estadísticas ni la fuente del valor. Cuando se pida implementar «Racha acumulada», definir primero qué se acumula y durante qué período.

El loto de «Racha acumulada» debe conservar su brillo difuminado clásico, pero el efecto debe recortarse a la silueta de la flor. No reemplazarlo por un halo circular detrás del ícono.

**Why:** El usuario aclaró que no quería quitar el brillo cuadrado original: quería corregir el clipping para que solo se viera dentro de la flor.

**How to apply:** Mantener el efecto difuminado en el contenido y aplicar una máscara con la forma del glifo; si cambia el icono o su tamaño, ajustar máscara y contenido juntos.

El loto de la píldora de racha en Inicio conserva el blanco del tratamiento clásico de la racha actual, no el dorado de «Racha acumulada».

**Why:** El usuario corrigió la elección anterior del dorado: ambas superficies representan la racha actual.

**How to apply:** Al ajustar el loto de Inicio o de «Racha actual» en Perfil, conservar el blanco; no trasladar allí el tratamiento dorado de la racha acumulada.

La separación entre la identidad de Perfil y la semana se mide desde la píldora visible, no desde el borde del avatar.

**Why:** En una identidad horizontal, el avatar puede ser más alto que el bloque de nombre, correo y píldora. Centrar ambos bloques verticalmente añade espacio debajo de la píldora y rompe la separación solicitada, aunque los márgenes exteriores no cambien.

**How to apply:** Mantener el borde inferior de la píldora alineado con el final del bloque de identidad, o compensar la diferencia mediante una medición real. No perder las acciones independientes de Mi cuenta y Tu camino al reorganizar la identidad.