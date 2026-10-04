---
name: Camino de crecimiento
description: Criterio de progreso y tratamiento visual acordados para la línea de tiempo botánica de Tu progreso.
---

Cuando se active el progreso funcional, los niveles del camino deberán depender del total de días **activos acumulados**, no de la racha actual ni de la mayor racha. Un nivel alcanzado no debe retroceder cuando se corta una racha. El arte del timeline y la portada de Intención en «Tu progreso» se muestran circulares y fundidos en el fondo con alfa radial suave en los bordes; no dejar marcos cuadrados ni borde blanco visible.

**Why:** El usuario escogió explícitamente los días acumulados aunque no sean consecutivos entre tres opciones. Tras probar imágenes cuadradas opacas, pidió difuminar y alinear las imágenes del timeline; luego pidió que la portada de Intención volviera a coincidir con ellas, sin borde.

**How to apply:** Al ampliar rangos o cambiar arte, mantener la métrica de días activos canónicos para cuando se active el progreso; usar el mismo arte con desvanecido radial para la portada de Intención y su fila del timeline.

El banner de Intención en Perfil también debe conservar el arte circular y el alfa radial de Tu camino, no una portada cuadrada opaca. Su aumento de brillo del 4 % es exclusivo de Perfil y no debe alterar el desvanecido ni el arte de las demás superficies.

**Why:** El usuario pidió volver a usar exactamente la imagen de Tu camino en Perfil, con un 4 % más de brillo, además de separar la píldora y la descripción del título.

**How to apply:** Mantener intacto el alfa al ajustar el brillo; no simularlo añadiendo un halo, un fondo claro ni un overlay que cambie la transparencia. Los ajustes de espaciado del banner son locales a Perfil, no a las filas de Tu camino ni al detalle de Intención.

La visibilidad de las ilustraciones no debe depender de un callback de scroll ni de animaciones en iOS. Mostrar las imágenes locales a tamaño explícito; la imagen de la etapa actual queda encendida y las demás apagadas, sin ocultarlas por completo. El punto también distingue la etapa actual.

**Why:** El usuario vio la línea de tiempo sin imágenes en su iPhone aunque la vista web sí las mostraba; después pidió recuperar el tratamiento apagado de las imágenes pendientes, reservando el brillo para la etapa actual.

**How to apply:** Mantener el arte presente desde el primer render, con atenuación solo por estado bloqueado, y preferir el cargador nativo para PNG locales del recorrido. Si vuelve a faltar arte en un dispositivo, comprobar eventos de error de carga antes de atribuirlo al diseño.

En desarrollo, todas las imágenes del recorrido disparadas a la vez por el túnel de Metro pueden fallar con «The request timed out» aunque los PNG existan y el servidor devuelva 200. Cargarlas de forma ordenada y mostrar la copia local descargada.

**Why:** Los registros del iPhone mostraron timeouts simultáneos para las fotos del timeline; comprobar los archivos y una descarga directa confirmó que no eran rutas rotas.

**How to apply:** Si se agregan ilustraciones o vuelve a faltar arte, distinguir un timeout de red de un archivo inexistente; evitar que el timeline inicie todas las descargas remotas al mismo tiempo.

Por ahora, mostrar **solo Intención (nivel 0) activa**, con el punto dorado; Semilla y todos los niveles siguientes quedan apagados, sin importar los días registrados. La píldora de días conserva el morado de las demás píldoras incluso para la etapa activa; solo el punto indica la posición en dorado. Este es un estado temporal para evaluar el diseño, no un cambio de criterio para el futuro.

**Why:** El usuario confirmó explícitamente que están probando el diseño, no la funcionalidad todavía; corrigió la vista previa para trasladar el punto dorado de Semilla a Intención y pidió que la píldora activa nunca cambiara a dorado.

**How to apply:** No reconectar las etapas a estadísticas hasta que se apruebe la dirección visual y el usuario pida activar el progreso. En ese momento usar los días activos acumulados no consecutivos acordados, sin tomar la racha como sustituto ni cambiar a dorado la píldora de días.

En la ayuda de Tu camino, «tap bar» significa el tirador superior de la hoja, no la barra inferior de navegación.

**Why:** El usuario lo aclaró explícitamente al elegir «la barrita superior para cerrar o arrastrar la ventana».

**How to apply:** Mantener ese tirador funcional tanto por toque como por arrastre hacia abajo; no añadir las pestañas de navegación dentro de esta ayuda.

En «Tu progreso», los siete círculos y la descripción entran juntos inmediatamente al terminar la entrada del contador con su fondo; no esperar a que acabe de contar la cifra ni escalonar cada círculo. El mensaje conserva su lugar por encima de «Esta semana» y del contador. Tu progreso no muestra Intención ni sesiones completadas; no alterar la tarjeta de Intención de Perfil ni su entrada escalonada.

**Why:** El usuario devolvió el mensaje a su ubicación anterior y luego pidió sincronizarlo con los siete círculos justo después de la entrada del contador y del fondo. Esa petición reemplaza la espera anterior a los dígitos y la cascada de días.

**How to apply:** Conservar la secuencia del contador y la separación entre superficies. Intención y el recorrido se acceden desde Perfil; no reintroducirlos en Tu progreso al reutilizar componentes.

Dentro de la ventana, usar el degradado completo del tema. Florecimiento y sus niveles se muestran sin animación ni espera; «El ascenso» muestra primero solo el encabezado y el botón «Próximamente», que despliega sus niveles sin animación al pulsarlo. No hay divisor arriba de la segunda etapa. En todas las filas, la píldora de días va encima del título; no mostrar etiquetas «Nivel».

**Why:** El usuario pidió el fondo completo del tema, la segunda etapa plegada inicialmente y eliminó las animaciones de los niveles y las etiquetas numéricas. Los cambios de apertura no deben reintroducir animaciones de las filas.

**How to apply:** No condicionar títulos o niveles del recorrido a eventos de scroll ni a mediciones de visibilidad; mostrarlos inmediatamente al abrir o expandir, manteniendo solo Intención como nivel activo hasta que se solicite la funcionalidad.

La ventana que se abre desde Intención en Perfil («Tu camino») debe abrirse a pantalla completa, como Sistema de rachas, no como un panel parcial de temporizador.

**Why:** El usuario reemplazó explícitamente la dirección anterior de apertura como el temporizador Ambiental por una ventana completa como la de rachas.

**How to apply:** Conservar el recorrido y los niveles apagados. La ayuda sigue siendo un panel interno de la misma ventana nativa; no convertirla en un segundo Modal.

Los avisos de avatares de Semilla, Crecimiento, Vegetación y Expansión son mensajes simples alineados con la descripción, no tarjetas ilustradas ni controles para reclamar recompensas. No recuperar el loto, cofres, píldora, fondo o borde exterior; conservar el candado junto a la frase completa en una sola línea.

**Why:** Tras probar el loto y una frase partida, el usuario pidió eliminar la imagen en todas las etapas, alinear candado y texto en una sola línea y aumentar el candado 3 puntos. Esto reemplaza expresamente el diseño anterior con el candado superpuesto a la imagen.

**How to apply:** Mantener los cuatro avisos desactivados hasta que se pida implementar recompensas; no añadir avisos a los demás niveles. Atenuar candado y texto juntos una sola vez fuera de la etapa actual. Conservar la alineación izquierda con la descripción y adaptar el texto a una sola línea sin reintroducir arte.

Expansión añade un segundo logro debajo del aviso de avatares: «Comparte sin sello de agua en Mi muro expansivo». Su icono es la misma + del banner de Mi muro expansivo de Perfil, rodeada por sus tres círculos blancos translúcidos concéntricos, no tres fotos ni fondos de historias. Conserva su candado superpuesto y el borde con el degradado real del muro. La simplificación del aviso de avatares no autoriza retirar este arte del muro.

**Why:** El usuario pidió este logro específicamente para Expansión y señaló que se cortaba la frase junto al loto. Corrigió explícitamente la interpretación de «tres fondos»: quería la + que gira en Perfil con sus tres círculos blancos con opacidad, no imágenes. El borde corresponde a la sección real del muro, no a un color dorado genérico.

**How to apply:** Mantenerlo como aviso visual apagado, sin activar todavía la recompensa ni cambiar la exportación de historias. No repetirlo en otras etapas. Reutilizar el arte del control real para evitar aproximaciones; conservar su giro original en Perfil, sin introducir loops en el logro bloqueado ni achicar el control original de Perfil. Permitir que la frase del muro crezca sin recorte y que su fila aumente de alto en el flujo normal; la frase de avatares conserva su regla independiente de una sola línea.

Los detalles de Florecimiento deben usar la plantilla de Sistema de rachas, con el hero original de cada etapa. La referencia de Semilla entregada por el usuario define la composición, no la imagen ni los textos de Intención.

**Why:** El usuario pidió empezar únicamente por Intención antes de replicar el diseño a las demás etapas. La referencia muestra una etapa distinta, pero el hero y el contenido deben corresponder a la que se abre.

**How to apply:** Mantener el fondo del tema, la navegación circular, los insets y el scroll elástico de Sistema de rachas; usar el arte de la etapa como hero sin alterar el recorte de sus imágenes en Perfil o en el recorrido. Abrir el detalle desde Tu camino y volver al mismo recorrido conservando su scroll. Añadir nuevos detalles solo cuando el usuario pida replicarlos; esto no autoriza activar progreso ni recompensas.

En el detalle de Intención, el hero ocupa toda la pantalla y usa el arte opaco original, sin máscara ni alfa radial. Encima lleva el mismo degradado superpuesto de la pantalla final del registro emocional de Inicio. El título y la píldora quedan bajo la parte principal del arte, en la transición hacia el fondo, con 15 px entre píldora y descripción.

**Why:** El usuario revisó la composición y pidió hero fullscreen sin difuminado propio, el degradado de emociones y los textos abajo. Reintrodujo la etiqueta de etapa en la cabecera, no como un bloque sobre el título. Al subir el hero, aclaró que su degradado debe acompañarlo: mover solo el arte hizo visible el borde inferior.

**How to apply:** Mantener fijas fuera del scroll la X con su fondo circular y la etiqueta pequeña de dos líneas «Primera etapa / Florecimiento», alineadas verticalmente. El fondo también queda fijo; título, píldora y textos sí desplazan juntos al hacer scroll. Recolocar arte y degradado como una unidad por defecto; si el usuario pide explícitamente mover solo la imagen, conservar el degradado y ajustar el arte dentro de esa unidad. Prolongar el color sólido de cierre hasta el borde de pantalla para evitar una costura al subirlos. Conservar el loto solo en la píldora, sin ayuda ni banner de «Elegir comenzar». No propagar el arte opaco a Perfil o Tu camino, que conservan su imagen radial.