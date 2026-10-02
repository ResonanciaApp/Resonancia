---
name: Camino de crecimiento
description: Criterio de progreso y tratamiento visual acordados para la línea de tiempo botánica de Tu progreso.
---

Cuando se active el progreso funcional, los niveles del camino deberán depender del total de días **activos acumulados**, no de la racha actual ni de la mayor racha. Un nivel alcanzado no debe retroceder cuando se corta una racha. El arte del timeline y la portada de Intención en «Tu progreso» se muestran circulares y fundidos en el fondo con alfa radial suave en los bordes; no dejar marcos cuadrados ni borde blanco visible.

**Why:** El usuario escogió explícitamente los días acumulados aunque no sean consecutivos entre tres opciones. Tras probar imágenes cuadradas opacas, pidió difuminar y alinear las imágenes del timeline; luego pidió que la portada de Intención volviera a coincidir con ellas, sin borde.

El rótulo «días de racha» en las píldoras de Florecimiento es una indicación visual, no una nueva definición de la métrica de avance.

**Why:** esa petición especificó el loto dorado, el texto y el aumento de altura de la píldora, sin pedir cambiar la progresión funcional.

**How to apply:** no inferir días consecutivos a partir del rótulo; conservar el criterio acumulado hasta que el usuario cambie explícitamente la regla de avance.

**How to apply:** Al ampliar rangos o cambiar arte, mantener la métrica de días activos canónicos para cuando se active el progreso; usar el mismo arte con desvanecido radial para la portada de Intención y su fila del timeline.

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

La entrada en «Tu progreso» tiene dos fases: primero termina el contador de días (incluidos sus dígitos), después arrancan **juntas** la descripción, Racha actual e Intención. «Mis estadísticas» no se muestra en Tu progreso, aunque permanece en Perfil. El contenido de Intención se revela con desvanecido y desplazamiento escalonado, no queda estático mientras entra la tarjeta. Las secciones tienen la separación de Perfil (21 px), sin divisor sobre la tarjeta. El recorrido completo vive dentro de una ventana casi a pantalla completa que entra desde abajo como el temporizador de Ambientales.

**Why:** El usuario corrigió el orden de entrada anterior, decidió que la pantalla principal mostrara solo Intención, pidió retirar la línea divisora e igualar las separaciones de Perfil. Tras probar una entrada de las tarjetas posterior a la descripción, pidió que descripción y tarjetas comenzaran simultáneamente. También retiró «Mis estadísticas» solo de Tu progreso.

**How to apply:** Esperar a que termine el contador antes de empezar la descripción; montar las dos tarjetas al mismo tiempo que comienza la descripción, sin depender de su finalización ni del último día semanal. Revelar también el contenido de Intención. Mantener el recorrido detallado en la ventana, no debajo de las tarjetas; animar solo la ventana al abrir y cerrar.

Dentro de la ventana, usar el degradado completo del tema. Florecimiento y sus niveles se muestran sin animación ni espera; «El ascenso» muestra primero solo el encabezado y el botón «Próximamente», que despliega sus niveles sin animación al pulsarlo. No hay divisor arriba de la segunda etapa. En todas las filas, la píldora de días va encima del título; no mostrar etiquetas «Nivel».

**Why:** El usuario pidió el fondo completo del tema, la segunda etapa plegada inicialmente y eliminó las animaciones de los niveles y las etiquetas numéricas. Después pidió que la ventana volviera a abrirse como la del temporizador Ambiental, sin reanimar las filas.

**How to apply:** No condicionar títulos o niveles del recorrido a eventos de scroll ni a mediciones de visibilidad; mostrarlos inmediatamente al abrir o expandir, manteniendo solo Intención como nivel activo hasta que se solicite la funcionalidad.