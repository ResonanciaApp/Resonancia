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

No confundir pruebas del protocolo de gestos con una validación de fluidez nativa.

**Why:** El usuario volvió a observar tirones después de pasar las pruebas de lógica y compilación. Esas pruebas no miden el costo de composición de la pantalla completa.

**How to apply:** Mantener el parallax de Inicio y evitar sombras desenfocadas o rasterizaciones costosas sobre todo su árbol durante el desplazamiento. Si no se ha medido la animación en un dispositivo, explicar esa limitación sin asegurar que desaparecieron los tirones.
