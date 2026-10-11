---
name: Transiciones desde el drawer
description: El menú estilo X revela sus destinos dentro de una superficie frontal compartida, sin una segunda entrada lateral.
---

El menú permanece fijo detrás de la pantalla desplazada. Elegir un destino prepara su contenido dentro de esa pantalla y cierra el menú mientras la pantalla regresa, en vez de abrir otra ventana lateral sobre un drawer que queda abierto.

**Why:** El usuario pidió reemplazar la interacción anterior por el comportamiento estilo X, sin flashes de Inicio ni una segunda animación de entrada.

**How to apply:** Usar un progreso cancelable para desplazamiento, esquinas, aclaración, sombra y aparición del menú. Registrar el origen del destino: las aperturas ajenas al drawer mantienen sus transiciones normales. No conservar el menú abierto al regresar a Biblioteca.

Las herramientas que tienen un host dentro de la superficie frontal, como Mezclador, también son destinos preparados antes del retorno; no deben abrirse como ventanas normales después de cerrar el drawer.

**Why:** El usuario detectó que Mezclador primero devolvía Inicio y después entraba como otra ventana, distinto al resto del menú. Tener una función llamada “desde drawer” no basta si todavía anima una entrada lateral propia.

**How to apply:** Conectar origen, posicionamiento sin entrada propia y confirmación de layout real en todos los niveles. Mantener la apertura normal cuando la herramienta se invoca desde Sonidos u otros accesos.

El fade de la identidad de Inicio incluye avatar, nombre del usuario y saludo juntos; no debe ocultar las acciones laterales ni cambiar el parallax vertical.

**Why:** El usuario pidió que el nombre y el saludo desaparezcan y reaparezcan acompañando al avatar.

**How to apply:** Conservar su sincronización al ajustar el drawer o el header; no añadir fades independientes ni multiplicar la opacidad del avatar.

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

**How to apply:** Preservar los efectos y las optimizaciones del cierre. El usuario pidió después un rebote leve al abrir; ese cambio de apertura no autoriza a aplicar el mismo rebote al cierre. Las confirmaciones anteriores no son mediciones de FPS.

El usuario volvió a confirmar que la apertura funciona perfectamente y restringió
la revisión del cierre a sus últimos 50 px.

**Why:** el movimiento de apertura está aprobado; modificar curvas compartidas
para intentar resolver el cierre pondría en riesgo lo que ya funciona.

**How to apply:** no cambiar apertura, su resorte ni sus efectos. Separar una
desaceleración continua de una congelación nativa antes de retocar ese tramo;
la física del motor sin renderizado no prueba la ausencia de tirones en iPhone.

El usuario aisló el fallo de cierre por origen del toque: desde el avatar del
drawer o sus zonas vacías casi nunca hay traba; desde la franja de Inicio sí.

**Why:** comparten la animación, pero no necesariamente el reconocimiento y la
finalización del toque. No atribuir automáticamente el fallo al resorte común.

**How to apply:** comparar los caminos de entrada y su cancelación durante un
arrastre; preservar el cierre desde el menú y la apertura ya aprobados. Esta
observación no confirma por sí sola una causa nativa ni la eficacia de un arreglo.

**Diagnóstico de rendimiento:** medir callbacks de frames de Reanimated y de
JavaScript no mide directamente la presentación final de Core Animation/GPU.
Comparar sus pausas con la grabación del teléfono antes de atribuir una causa.

**Why:** el resorte puede avanzar correctamente mientras el contenido visible
se congela; un registro «sin pausas» del callback no descarta esa congelación.

**How to apply:** instrumentación manual y acotada, sin logs ni renders React
por frame; callbacks estables para que medir no agregue registros/desregistros
justo al abrir/cerrar. El informe es orientativo, no una medición de Instruments.

Servir JavaScript con `__DEV__ = false` en un development client es una prueba
parcial, no una compilación nativa de distribución.

**Why:** elimina ayudas JS de desarrollo, pero mantiene el contenedor nativo
de desarrollo y Metro como origen. Además desactiva el diagnóstico y los
toggles Premium de desarrollo, y puede cambiar la configuración de compras.

**How to apply:** comparar solo navegación/drawer, no compras ni permisos
simulados. Verificar el manifiesto y el preámbulo del bundle, no solo los flags
del comando. No presentar esa prueba como equivalente a TestFlight ni como
ausencia demostrada de un problema nativo.

El usuario detectó que el tirón reaparece después de visitar Perfil. El primer
registro mostró muchos retrasos de callbacks JS y pocos de UI, sin demostrar
qué componente consume el tiempo ni medir la presentación final.

**Why:** las tabs visitadas permanecen montadas; la prueba en Inicio recién
abierto no representa necesariamente el coste después de navegar.

**How to apply:** incluir ciclos Inicio–Perfil–drawer al verificar rendimiento.
Los consumidores de acciones/datos no deben suscribirse al estado de apertura
solo para obtener funciones estables. No interpretar correlación temporal
entre un commit y un retraso como un perfil de CPU.

Los umbrales de reposo de un resorte sobre progreso normalizado deben evaluarse en píxeles y en las superficies derivadas, no solo comprobando que el valor final es cero.

**Why:** El motor puede forzar el último valor al destino cuando todavía queda un salto visible; una función de radio con pendiente alta amplifica ese salto. Un mock que asigna directamente el destino oculta esta discontinuidad.

**How to apply:** Ejecutar los fotogramas y la terminación del motor instalado, distinguir el corte por energía del clamping por sobrepaso y comparar la trayectoria anterior. Conservar la apertura validada y separar siempre estos resultados de una medición de FPS nativa.

Un rebote pequeño debe limitarse en píxeles mediante la física, no comprimiendo de forma no lineal la posición renderizada.

**Why:** La compresión puede verse correcta al abrir, pero su inversa amplifica mucho la velocidad al interrumpir el rebote y puede hacer que un cierre avance casi toda la pantalla en un solo fotograma. Igualar solo la derivada inicial no garantiza una trayectoria correcta.

**How to apply:** Mantener posición y velocidad en coordenadas lineales del mismo valor compartido. Evaluar sobrepasos con el motor real a distintos anchos y velocidades, conservar el límite visual también en tablets y permitir que un nuevo gesto capture la posición sobrepasada sin saltar al destino.
