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