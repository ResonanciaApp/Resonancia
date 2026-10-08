---
name: Progreso visible en Perfil
description: Orden actual del progreso en Perfil y su relación con Tu progreso.
---

Perfil oculta la sección de los siete días, sin reservar su espacio. Historial de rachas, Intención y calendario permanecen visibles con sus tratamientos independientes. Inicio y Tu progreso conservan sus siete días.

**Why:** Después de ajustar el fondo, el título, la posición y el ancho de los días, el usuario pidió esconder esa sección específicamente en Perfil.

**How to apply:** No recuperar la fila de días en Perfil al reutilizar el componente de progreso. Ocultar esa fila no autoriza retirar el historial de rachas ni propagar el cambio a Inicio o Tu progreso.

En Perfil, el historial de rachas de usuarios Premium va 15 px más abajo respecto de su posición base; los gratuitos mantienen esa posición base.

**Why:** El usuario pidió bajar las rachas 30 px solo para Premium y luego subirlas 15 px «y arrastra», manteniendo intacta la posición de los gratuitos.

**How to apply:** El espacio adicional pertenece al flujo, conservando las separaciones con las secciones posteriores. No trasladar el avatar ni conservar el desplazamiento al cambiar a una cuenta gratuita.

En los cuatro espacios del historial de rachas de Perfil, el número y su título forman un conjunto centrado verticalmente respecto de su icono; no van anclados al borde inferior.

**Why:** El usuario pidió alinear el número y el título de los cuatro espacios con el centro de su icono correspondiente. Después pidió bajar la sección de rachas 20 px, independientemente de la fila de siete días.

**How to apply:** Conservar las dos filas, los iconos a la izquierda y los insets de la tarjeta; no extender este ajuste a otras estadísticas compartidas ni cambiar las cifras. El desplazamiento del historial pertenece al flujo y lleva el contenido posterior, sin mover los siete días.

La raya horizontal de las rachas de Perfil debe estar en el centro de su tarjeta, sin compensación hacia arriba.

**Why:** El usuario pidió que estuviera justo en la mitad y confirmó bajarla para centrarla; la alineación de los textos no autoriza a desplazar también esta raya.

**How to apply:** Conservar márgenes simétricos alrededor del divisor y comprobar el centro respecto de la tarjeta completa, sin mover sus filas ni el contenido posterior.

Perfil muestra primero los siete días en un bloque negro con el título interior «Progreso semanal», encima del historial completo de cuatro cifras. Conserva puntos de creatividad expansiva, Intención y después el calendario, seguido del contenido personal restante. Tu progreso muestra el mensaje de práctica encima de «Esta semana» y del contador, seguido de los siete días, sin sesiones completadas, divisores, historial de rachas ni tarjeta de Intención. Los tratamientos de ambas superficies son independientes.

**Why:** El usuario pidió restaurar los siete días encima de Rachas en Perfil, con fondo negro y título interior. En Tu progreso retiró la sección de sesiones completadas y su divisor, pero después devolvió únicamente el mensaje a su ubicación anterior por encima del contador. Esa corrección no revierte los otros cambios; Perfil conserva sus accesos personales.

**How to apply:** Configurar cada superficie por separado. Retirar las completadas de Tu progreso no autoriza a borrar actividad histórica, ni a ocultar el historial o el calendario de Perfil. No reintroducir «Mis estadísticas» en Perfil.

Intención precede al calendario en Perfil; puntos de creatividad expansiva conserva su posición anterior a ambas.

**Why:** Después de añadir puntos, el usuario volvió a pedir intercambiar únicamente Intención y calendario. No solicitó mover puntos ni cambiar las acciones.

**How to apply:** Conservar las separaciones entre rachas, puntos, Intención, calendario y el contenido posterior. No propagar este orden a otras pantallas compartidas.

“Puntos creatividad” queda debajo de las rachas de Perfil. Toda la sección abre la ventana informativa y no muestra «?». La barra sigue siendo solo visual, en 0/100. El texto sobre puntuación de atención plena es provisional y no define reglas reales de puntuación.

**Why:** El usuario dejó el funcionamiento de los puntos para después. Luego pidió activar la ayuda con el título y la descripción de su referencia «por mientras», usando la animación y los fondos del temporizador Ambiental. Finalmente sustituyó el «?» por la pulsación de cualquier parte de la sección, sin cambiar la ventana.

**How to apply:** No vincular puntos a sesiones, rachas ni actividad ni implementar las reglas que menciona el texto provisional. El cálculo requiere una petición posterior. Conservar el texto entregado hasta que el usuario pida reemplazarlo y mantener la ayuda visualmente coherente con el temporizador Ambiental, incluida su excepción de color para Índigo 2.

En Perfil, Intención conserva contenido y acceso a Tu camino, pero su tarjeta debe ser compacta y respetar la misma distancia entre borde y contenido que el historial de rachas.

**Why:** El usuario pidió reducir su altura y hacer coherentes los espacios interiores de ambas tarjetas, no reducir el arte ni cambiar el recorrido.

**How to apply:** Mantener los insets del historial como referencia para la tarjeta de Intención; no forzar una altura que introduzca espacio vacío adicional.

La píldora de Intención y la tarjeta de Intención de Perfil abren directamente la misma ventana canónica «Tu camino». El toque en la píldora no debe abrir Mi cuenta y usa el mismo feedback de reducción/rebote que actualizar recomendaciones de Inicio.

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

La explicación editorial de «Racha acumulada» describe el total desde el comienzo, pero ese texto no autoriza por sí solo a cambiar el cálculo de la cifra ni a asumir que ya existe un contador acumulado real.

**Why:** El usuario reemplazó después las explicaciones por textos exactos, definiendo «Racha acumulada» como total de días. Esa solicitud fue de títulos y descripciones, no de estadísticas; reemplaza la dirección editorial anterior que explicitaba el récord duplicado.

**How to apply:** Respetar el texto elegido y tratar la implementación del contador real como un cambio funcional separado. No afirmar que ya se cambió el cálculo al editar la descripción.

El loto de «Racha acumulada» debe conservar su brillo difuminado clásico, pero el efecto debe recortarse a la silueta de la flor. No reemplazarlo por un halo circular detrás del ícono.

**Why:** El usuario aclaró que no quería quitar el brillo cuadrado original: quería corregir el clipping para que solo se viera dentro de la flor.

**How to apply:** Mantener el efecto difuminado en el contenido y aplicar una máscara con la forma del glifo; si cambia el icono o su tamaño, ajustar máscara y contenido juntos.

En «Tu progreso», los siete días entran individualmente de lunes a domingo, escalonados en cascada; no sustituir esa secuencia por la aparición simultánea de toda la fila.

**Why:** El usuario pidió restaurar la entrada escalonada anterior, sin cambiar el contador ni el texto.

**How to apply:** Conservar independiente la animación individual de la semana de la entrada conjunta del resto del contenido; no trasladar este cambio automáticamente a Perfil.

El loto de la píldora de racha en Inicio conserva el blanco del tratamiento clásico de la racha actual, no el dorado de «Racha acumulada».

**Why:** El usuario corrigió la elección anterior del dorado: ambas superficies representan la racha actual.

**How to apply:** Al ajustar el loto de Inicio o de «Racha actual» en Perfil, conservar el blanco; no trasladar allí el tratamiento dorado de la racha acumulada.

Perfil no muestra el título «Historial de rachas» ni los tres puntos de información; conserva las cifras sin una fila de encabezado vacía.

**Why:** El usuario pidió retirar primero el título y después también los tres puntos de ese bloque en Perfil, reemplazando la dirección anterior de conservar el acceso informativo.

**How to apply:** Mantener independiente el encabezado de Perfil de otras pantallas que comparten el bloque. No reintroducir el título ni los puntos sin una nueva petición, ni modificar las estadísticas por estos cambios de presentación.

La imagen de Intención en Perfil lleva solo un resplandor pequeño y tenue que sale del fondo; nunca un anillo o un borde luminoso.

**Why:** El usuario rechazó la variante anterior por mostrar un anillo blanco y reiteró que el efecto debía ser sutil. Esa variante aplicaba un filtro de brillo al contenedor del PNG transparente.

**How to apply:** Para ajustar el brillo, modificar únicamente el RGB del arte conservando su alfa radial, sin filtrar el contenedor. Mantener el resplandor como una capa independiente detrás de la imagen y preservar las otras superficies.
