---
name: Orden de controles del temporizador Ambiental
description: Jerarquía del selector manual, alcance de su ventana y colores independientes de Registrar.
---

El temporizador Ambiental crece desde su borde superior. En modo manual, Empezar sesión va arriba y Cancelar debajo; el reloj queda centrado en el espacio entre el título y Empezar sesión.

Durante la transición desde +, Empezar sesión conserva su color normal aunque esté bloqueado. Cancelar debe tener las mismas dimensiones y el mismo estilo de texto que Empezar sesión.

Cancelar deshace el modo manual dentro de la misma ventana: invierte la secuencia completa y vuelve a las duraciones predefinidas. No equivale a cerrar el selector.

**Why:** El usuario revisó la restricción anterior de no mover Empezar: pidió llevarlo al lugar que ocupaba Cancelar y dejar Cancelar en la posición inicial de Empezar. También pidió quitar el atenuado automático de Empezar al pulsar + e igualar los tamaños. No conservar Cancelar encima para mantener inmóvil la acción principal.

El usuario pidió explícitamente que Cancelar reproduzca «exactamente el proceso contrario», sin cerrar la ventana.

**How to apply:** Al ajustar esta hoja, mantener ese orden y el centrado del reloj. La apertura y el cierre del panel son movimientos independientes de la expansión y su reversa interna; no conectar Cancelar al cierre general.

Cuando el usuario se refiera a la «ventana del temporizador», revisar también el selector de duración Ambiental, no solo la ventana titulada literalmente Temporizador.

**Why:** Una petición sobre el fondo de Cloudy se aplicó inicialmente solo a la ventana con ese título, pero el usuario indicó que la ventana que estaba usando seguía sin cambiar.

**How to apply:** Comprobar las entradas de duración y sueño antes de limitar un cambio al título literal. Los filtros de búsqueda y la información de puntos son superficies independientes: no heredan automáticamente un cambio de fondo del temporizador.

Las acciones de iniciar audio deben conservar una paleta propia, independiente de las constantes editoriales del botón Registrar.

**Why:** Empezar sesión dependía de una constante compartida que ya no se exportaba; en Cloudy e Índigo 2, su fondo quedaba sin un color definido.

**How to apply:** Al retirar o modificar constantes de botones, comprobar sus consumidores antes de eliminarlas. En temporizadores, mantener una superficie explícita y contraste para texto e iconos, sin propagar cambios a Vuelve a ti ni a otros temas por accidente.