---
name: Camino de crecimiento
description: Criterio de progreso y tratamiento visual acordados para la línea de tiempo botánica de Tu progreso.
---

Cuando se active el progreso funcional, los niveles del camino deberán depender del total de días **activos acumulados**, no de la racha actual ni de la mayor racha. Un nivel alcanzado no debe retroceder cuando se corta una racha. El arte se muestra circular, alineado en una columna y fundido en el fondo con alfa radial suave en los bordes; no dejar marcos cuadrados visibles.

**Why:** El usuario escogió explícitamente los días acumulados aunque no sean consecutivos entre tres opciones. Tras probar imágenes cuadradas opacas, pidió volver a difuminar los bordes, alinear todas las imágenes y finalmente hacerlas circulares.

**How to apply:** Al ampliar rangos o cambiar arte, mantener la métrica de días activos canónicos para cuando se active el progreso; conservar la forma circular, el desvanecido radial y la alineación común salvo nueva indicación.

La visibilidad de las ilustraciones no debe depender por completo de un callback de scroll ni arrancar desde opacidad cero en iOS. El movimiento de entrada puede añadir un matiz, pero el arte local debe mostrarse incluso si ese callback se retrasa.

**Why:** El usuario vio la línea de tiempo sin imágenes en su iPhone aunque la vista web sí las mostraba; un contenido esencial no debe quedar oculto por la animación.

**How to apply:** Mantener una opacidad base visible y preferir el cargador nativo para PNG locales del recorrido. Si vuelve a faltar arte en un dispositivo, comprobar eventos de error de carga antes de atribuirlo al diseño.

Por ahora, mostrar **solo Intención (nivel 0) activa**, con el punto dorado; Semilla y todos los niveles siguientes quedan apagados, sin importar los días registrados. Este es un estado temporal para evaluar el diseño, no un cambio de criterio para el futuro.

**Why:** El usuario confirmó explícitamente que están probando el diseño, no la funcionalidad todavía; después corrigió la vista previa para trasladar el punto dorado de Semilla a Intención.

**How to apply:** No reconectar las etapas a estadísticas hasta que se apruebe la dirección visual y el usuario pida activar el progreso. En ese momento usar los días activos acumulados no consecutivos acordados, sin tomar la racha como sustituto.

La entrada en «Tu progreso» debe respetar este orden: termina **toda** la sección de racha (incluido el último día de la fila semanal), aparece «Mis estadísticas» con sus cifras y solo entonces aparece la tarjeta del nivel 0. Las secciones tienen la separación de Perfil (21 px), sin divisor sobre la tarjeta. El recorrido completo vive dentro de una ventana casi a pantalla completa que sube desde abajo al pulsar esa tarjeta.

**Why:** El usuario corrigió el orden de entrada anterior, decidió que la pantalla principal mostrara solo Intención y pidió retirar la línea divisora e igualar las separaciones de Perfil.

**How to apply:** Si cambia la duración de la semana o las estadísticas, sincronizar la entrada de la tarjeta con el final de esa secuencia sin reintroducir el divisor. Mantener el recorrido detallado en la ventana y no volver a mostrarlo completo bajo las estadísticas.

Dentro de la ventana, usar el degradado completo del tema. Florecimiento y sus niveles entran en secuencia vertical sin depender del scroll; «El ascenso» muestra primero solo el encabezado y el botón «Próximamente», que despliega sus niveles al pulsarlo. No hay divisor arriba de la segunda etapa.

**Why:** El usuario pidió el fondo completo del tema y que la segunda etapa quedara plegada inicialmente pero disponible para explorar al pulsar, sin la línea anterior.

**How to apply:** No condicionar títulos o niveles del recorrido a eventos de scroll ni a mediciones de visibilidad; animar Florecimiento al abrir y los niveles de El ascenso al expandirlo, manteniendo solo Intención como nivel activo hasta que se solicite la funcionalidad.