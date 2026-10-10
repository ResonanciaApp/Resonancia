---
name: Transiciones desde el drawer
description: El menú estilo X revela sus destinos dentro de una superficie frontal compartida, sin una segunda entrada lateral.
---

El menú permanece fijo detrás de la pantalla desplazada. Elegir un destino prepara su contenido dentro de esa pantalla y cierra el menú mientras la pantalla regresa, en vez de abrir otra ventana lateral sobre un drawer que queda abierto.

**Why:** El usuario pidió reemplazar la interacción anterior por el comportamiento estilo X, sin flashes de Inicio ni una segunda animación de entrada.

**How to apply:** Usar un progreso cancelable para desplazamiento, esquinas, aclaración, sombra y aparición del menú. Registrar el origen del destino: las aperturas ajenas al drawer mantienen sus transiciones normales. No conservar el menú abierto al regresar a Biblioteca.

La confirmación de destino listo debe corresponder a la selección concreta y ocurrir después de montar el contenido, no tras un timeout estimado. Repetir una selección de un overlay ya montado también exige una confirmación nueva sin perder su contenido.

**Why:** Una confirmación tardía de otra pantalla puede cerrar el menú antes de preparar la elegida; esperar solo un cambio de estado que ya era verdadero puede dejarlo bloqueado.

**How to apply:** Invalidar también las selecciones que ya confirmaron readiness pero tienen un callback pendiente. Un cierre programático debe invalidar los eventos de un gesto anterior, incluidos los que cruzan del hilo de UI al de JS. Mantener la composición y la sombra hasta terminar el movimiento real.

Mientras el dedo arrastra Inicio, no montar una nueva capa táctil encima ni iniciar una animación de asentamiento. El progreso debe seguir directamente la traslación del dedo; cancelar el timing anterior en el hilo de UI, no después de cruzar a JavaScript.

**Why:** El usuario observó apertura anticipada y tirones: una capa nueva puede cancelar el reconocedor original y una cancelación tardía compite con sus actualizaciones.

**How to apply:** Separar las suscripciones estables de Inicio de los estados de apertura del menú. La aparición de contenido debe durar mientras se revela, no concluir cuando todavía está oculto detrás de la pantalla.

No dar por aislado Inicio solo porque su conexión directa al drawer sea estable: revisar también los proveedores intermedios de herramientas y la navegación.

**Why:** Un proveedor que escucha los estados transitorios del menú puede propagar sus actualizaciones a Inicio mediante otro contexto, aunque la suscripción directa de Inicio no haya cambiado. El usuario confirmó una mejora parcial al aislar esta cadena; no equivale a resolver todos los tirones.

**How to apply:** Mantener las conexiones de destinos y herramientas independientes de abrir/cerrar el menú. Los callbacks estables que necesitan saber si la superficie está bloqueada deben leer el estado vigente, no conservar una captura antigua. Esto limita actualizaciones indirectas; no demuestra por sí solo la causa de los tirones.

Cancelar el movimiento en UI no invalida por sí solo las finalizaciones que ya están pendientes en JavaScript. La identidad de cada gesto debe cambiar en UI antes de cruzar el puente; el asentamiento debe iniciarse allí con la última posición y velocidad del dedo.

**Why:** Una prueba con JS retrasado reprodujo una finalización antigua que iniciaba apertura automática y bloqueaba un segundo arrastre, aunque este ya había cancelado la animación. Además, una curva nueva puede provocar un tirón de velocidad aun sin pérdida de FPS.

**How to apply:** Reservar las generaciones de gesto en UI y validar también los callbacks de finalización/readiness. JS puede publicar estados discretos, pero no debe reiniciar el movimiento de un gesto soltado. Separar siempre la continuidad matemática verificada de la fluidez nativa: las pruebas con mocks no miden GPU ni FPS.

El usuario confirmó que la apertura por avatar quedó fluida al conservar el movimiento en UI y la continuidad de velocidad; el cierre mejoró mucho pero conservó una pequeña traba al final.

**Why:** Esta confirmación permite separar el problema de cierre de la apertura ya validada, en vez de volver a probar cambios generales de curva, sombra o radio.

**How to apply:** Preservar la apertura y los efectos. Investigar el trabajo que coincide con el final del cierre, sin tratar la confirmación como una medición de FPS o como prueba de que todo el drawer está resuelto.
