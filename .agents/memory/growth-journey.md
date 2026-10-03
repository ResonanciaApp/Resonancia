---
name: Camino de crecimiento
description: Criterio de progreso y tratamiento visual acordados para la línea de tiempo botánica de Tu progreso.
---

Cuando se active el progreso funcional, los niveles del camino deberán depender del total de días **activos acumulados**, no de la racha actual ni de la mayor racha. Un nivel alcanzado no debe retroceder cuando se corta una racha. El arte del timeline y la portada de Intención en «Tu progreso» se muestran circulares y fundidos en el fondo con alfa radial suave en los bordes; no dejar marcos cuadrados ni borde blanco visible.

**Why:** El usuario escogió explícitamente los días acumulados aunque no sean consecutivos entre tres opciones. Tras probar imágenes cuadradas opacas, pidió difuminar y alinear las imágenes del timeline; luego pidió que la portada de Intención volviera a coincidir con ellas, sin borde.

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

En «Tu progreso», los siete círculos y la descripción entran juntos inmediatamente al terminar la entrada del contador con su fondo; no esperar a que acabe de contar la cifra ni escalonar cada círculo. El mensaje conserva su lugar por encima de «Esta semana» y del contador. Tu progreso no muestra Intención ni sesiones completadas; no alterar la tarjeta de Intención de Perfil ni su entrada escalonada.

**Why:** El usuario devolvió el mensaje a su ubicación anterior y luego pidió sincronizarlo con los siete círculos justo después de la entrada del contador y del fondo. Esa petición reemplaza la espera anterior a los dígitos y la cascada de días.

**How to apply:** Conservar la secuencia del contador y la separación entre superficies. Intención y el recorrido se acceden desde Perfil; no reintroducirlos en Tu progreso al reutilizar componentes.

Dentro de la ventana, usar el degradado completo del tema. Florecimiento y sus niveles se muestran sin animación ni espera; «El ascenso» muestra primero solo el encabezado y el botón «Próximamente», que despliega sus niveles sin animación al pulsarlo. No hay divisor arriba de la segunda etapa. En todas las filas, la píldora de días va encima del título; no mostrar etiquetas «Nivel».

**Why:** El usuario pidió el fondo completo del tema, la segunda etapa plegada inicialmente y eliminó las animaciones de los niveles y las etiquetas numéricas. Los cambios de apertura no deben reintroducir animaciones de las filas.

**How to apply:** No condicionar títulos o niveles del recorrido a eventos de scroll ni a mediciones de visibilidad; mostrarlos inmediatamente al abrir o expandir, manteniendo solo Intención como nivel activo hasta que se solicite la funcionalidad.

La ventana que se abre desde Intención en Perfil («Tu camino») debe abrirse a pantalla completa, como Sistema de rachas, no como un panel parcial de temporizador.

**Why:** El usuario reemplazó explícitamente la dirección anterior de apertura como el temporizador Ambiental por una ventana completa como la de rachas.

**How to apply:** Conservar el recorrido y los niveles apagados. La ayuda sigue siendo un panel interno de la misma ventana nativa; no convertirla en un segundo Modal.

Semilla, Crecimiento, Vegetación y Expansión muestran «Desbloquea 50 avatares nuevos» con el mismo color y atenuación de la descripción, sin cofres. El aviso va justo debajo de la descripción, limitado al ancho de su columna, sin fondo y con borde blanco de 1 px al 10 %. El loto a la izquierda tiene borde blanco al 20 %, overlay negro al 22 % y candado relleno de 13 puntos sobresaliendo de la esquina superior izquierda. El texto a la derecha se divide en «Desbloquea 50» y «avatares nuevos».

**Why:** El usuario eligió mantener solo el loto, eliminar el fondo y limitar el banner al ancho de la descripción. Reiteró que todo debe estar apagado fuera de la etapa actual. Su última revisión reemplaza el borde dorado por blanco, añade un borde exterior tenue, fija dos líneas de texto y pide sacar más el candado hacia la esquina.

**How to apply:** Mantener los cuatro avisos desactivados hasta que se pida implementar recompensas; no añadir avisos a los demás niveles. Atenuar todo el aviso de una etapa no actual, incluidos texto, imagen, candado y borde; ningún adorno debe quedar brillante. Aplicar la atenuación una sola vez para no oscurecer doblemente la imagen. El overlay negro pertenece al círculo, no a la fila.