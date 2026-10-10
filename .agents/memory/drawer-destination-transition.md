---
name: Transiciones desde el drawer
description: El menú estilo X revela sus destinos dentro de una superficie frontal compartida, sin una segunda entrada lateral.
---

El menú permanece fijo detrás de la pantalla desplazada. Los destinos overlay preparan su contenido dentro de esa pantalla antes del cierre. Las rutas del navegador esperan al cierre real antes de navegar, conservando Inicio montado durante todo el movimiento.

**Why:** El usuario pidió el comportamiento estilo X y posteriormente exigió coordinar el cambio de ruta con el cierre para no montar otra ruta durante el desplazamiento.

**How to apply:** Usar un progreso cancelable para desplazamiento, esquinas, aclaración, sombra y aparición del menú. Registrar el origen del destino: las aperturas ajenas al drawer mantienen sus transiciones normales. No conservar el menú abierto al regresar a Biblioteca.

El asentamiento al soltar debe arrancar directamente en el hilo UI; JavaScript solo registra el estado y recibe la finalización. Todo nuevo gesto invalida también las finalizaciones que ya estén en la cola JS.

**Why:** Esperar el viaje UI→JS→UI introduce una pausa cuando JS está ocupado. Los tests con la cola JS detenida confirman esta independencia, pero no demuestran una mejora de FPS en un dispositivo.

**How to apply:** Mantener un solo progreso compartido, cancelar el timing al empezar el gesto y verificar la versión tanto al iniciar comandos como al recibir finalizaciones.

No dar por validada una nueva capa de planificación UI con un mock que ejecuta `runOnUI` sincrónicamente.

**Why:** Tras introducir esa capa, el usuario reportó que tocar el avatar bloqueaba Inicio sin abrir el menú, aunque los tests deterministas pasaban.

**How to apply:** La apertura programática conserva la asignación directa de timing al shared value; cualquier cambio de planificación entre hilos necesita verificar sus colas reales y la interacción nativa.

No releer inmediatamente desde JS un SharedValue recién escrito para obtener la versión del comando: conservar y pasar el valor calculado.

**Why:** Los setters nativos de Reanimated programan escrituras en UI. Una lectura inmediata puede devolver la versión anterior y hacer que se descarte una apertura o su finalización, dejando el bloqueo táctil activo. El mock síncrono ocultaba esa carrera.

**How to apply:** Probar apertura, cierre y navegación también con escrituras nativas diferidas. Los gestos que ya corren en UI no necesitan esa compensación.

La confirmación de destino listo debe corresponder a la selección concreta y ocurrir después de montar el contenido, no tras un timeout estimado. Repetir una selección de un overlay ya montado también exige una confirmación nueva sin perder su contenido.

**Why:** Una confirmación tardía de otra pantalla puede cerrar el menú antes de preparar la elegida; esperar solo un cambio de estado que ya era verdadero puede dejarlo bloqueado.

**How to apply:** Invalidar también las selecciones que ya confirmaron readiness pero tienen un callback pendiente. Un cierre programático debe invalidar los eventos de un gesto anterior, incluidos los que cruzan del hilo de UI al de JS. Mantener la composición y la sombra hasta terminar el movimiento real.

Mientras el dedo arrastra Inicio, no montar una nueva capa táctil encima ni iniciar una animación de asentamiento. El progreso debe seguir directamente la traslación del dedo; cancelar el timing anterior en el hilo de UI, no después de cruzar a JavaScript.

**Why:** El usuario observó apertura anticipada y tirones: una capa nueva puede cancelar el reconocedor original y una cancelación tardía compite con sus actualizaciones.

**How to apply:** Separar las suscripciones estables de Inicio de los estados de apertura del menú. La aparición de contenido debe durar mientras se revela, no concluir cuando todavía está oculto detrás de la pantalla.

No dar por aislado Inicio solo porque su conexión directa al drawer sea estable: revisar también los proveedores intermedios de herramientas y la navegación.

**Why:** Un proveedor que escucha los estados transitorios del menú puede propagar sus actualizaciones a Inicio mediante otro contexto, aunque la suscripción directa de Inicio no haya cambiado. El usuario confirmó una mejora parcial al aislar esta cadena; no equivale a resolver todos los tirones.

**How to apply:** Mantener las conexiones de destinos y herramientas independientes de abrir/cerrar el menú. Los callbacks estables que necesitan saber si la superficie está bloqueada deben leer el estado vigente, no conservar una captura antigua. Esto limita actualizaciones indirectas; no demuestra por sí solo la causa de los tirones.
