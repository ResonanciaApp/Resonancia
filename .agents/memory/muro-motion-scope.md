---
name: Movimiento de Mi muro
description: Distinción deliberada entre el rebote del control de expansión y la entrada del formulario.
---

El borde del Muro de reflexiones debe seguir visible al colapsar y atenuarse al abrir, no aparecer solo con el formulario.

En Perfil, el panel de Muro de reflexiones se despliega únicamente al pulsar su botón +. Una solicitud previa de redacción o de foco no autoriza a desplegarlo después, aunque cambie el cupo, termine una animación o se vuelva a visitar la pantalla.

**Why:** El usuario observó aperturas espontáneas. Las solicitudes de foco persistentes podían ejecutarse de nuevo cuando llegaban datos asíncronos, y una apertura pendiente podía competir con un cierre manual.

**How to apply:** Mantener el control de apertura de Perfil separado de las solicitudes programáticas de foco usadas en otras superficies; cancelar cualquier reapertura pendiente cuando se cierra con +. Una solicitud nueva de foco sí debe abrir el teclado cuando el panel ya está abierto y el usuario toca para escribir; una descartada con el panel cerrado no se revive al cargar datos. Conservar la animación existente del control y el desplazamiento del contenido.

**Why:** El usuario corrigió explícitamente la interpretación de fade-in/fade-out: quiere mayor presencia del borde cerrado y menor presencia al desplegar.

**How to apply:** Animar entre ambos niveles de opacidad conservando color, grosor, dimensiones y gestos; nunca usar cero como estado cerrado por interpretar “fade out”.

Al abrir el compositor, mostrar el placeholder sin enfocar automáticamente el campo. El teclado se activa solo al tocar la caja de escritura.

**Why:** El usuario reemplazó la solicitud antigua del cursor automático: al abrir quiere el placeholder y ningún teclado. El foco automático del cursor podía activar intermitentemente el flujo de escritura.

**How to apply:** No enfocar al completar la apertura ni tratar onFocus como un toque. En Perfil, exigir una solicitud de escritura explícita pendiente antes de aceptar el foco del scroll padre; conservar las restricciones de publicación gratuita.

Los cambios al compositor necesitan una prueba que pulse Registrar y recorra tanto el éxito como el fallo del guardado, además de verificar su aspecto.

**Why:** Las pruebas visuales y de foco pasaban mientras una referencia retirada del placeholder seguía ejecutándose al guardar y cerraba la app.

**How to apply:** En los refactors del editor, ejecutar la acción real con categoría y texto, confirmar que conserva el borrador ante error y que lo limpia solo tras éxito. No sustituir esa comprobación por inspeccionar los props del botón.

Mostrar el cursor al expandir el compositor no equivale a una intención de escribir: el placeholder debe permanecer hasta el toque explícito del usuario. El teclado tampoco debe abrirse solo por mostrar la sección.

**Why:** El usuario precisó que el placeholder desaparece al tocar el campo, no antes. El foco nativo usado para mostrar el cursor no debe anticipar esa acción.

**How to apply:** Distinguir el foco visual del inicio de edición; conservar la espera del desplazamiento del padre antes de abrir el teclado y comprobar la visibilidad del placeholder antes y después del toque.

En Mi muro expansivo, la “+” tiene rebote exclusivamente angular: sobrepasa su orientación, cruza de vuelta con menor amplitud y se amortigua gradualmente. Los tabs, el campo de mensajes y los botones entran con fade-in y desplazamiento descendente monótono, sin sobrepasar ni rebotar; el cierre tampoco rebota. Al plegar, el contenido permanece quieto y opaco dentro del recorte mientras este lo oculta progresivamente de abajo hacia arriba. Al CERRAR, la “+” y sus tres círculos arrancan JUNTOS desde el toque; es el MOVIMIENTO DE LA PANTALLA el que debe esperar a que termine el pliegue. La “+” es simétrica cada 90°, así que tres giros perceptibles no requieren tres vueltas físicas completas.

**Why:** El usuario percibió tres vueltas físicas de la “+” como unas diez vueltas rápidas, rechazó el desplazamiento y cambio aparente de tamaño del icono, y señaló que el rebote del formulario al llegar abajo era incorrecto. Una oscilación matemática breve de ~250 ms con cruces menores a 6° se percibió como parada en seco; una secuencia con más segmentos se percibió como cinco rebotes incluso cuando pretendía representar menos. El tirón al cerrar provenía del desplazamiento del contenedor durante el pliegue, no del giro de la “+”; retrasar el giro fue una interpretación errónea explícitamente corregida por el usuario. Confirmó que reservar la altura hasta terminar el pliegue funciona, y pidió que el movimiento posterior sea más pausado y sutil, como el scroll al desplegar.

**How to apply:** Tras el giro, usar solo tres movimientos de rebote: primer cruce moderado, segundo más sutil y ajuste final casi imperceptible. Conservar el centro/tamaño del icono y la entrada suave del contenido; no trasladar el rebote al formulario. El pliegue progresivo oculta primero los botones, luego el campo y por último las categorías; evitar animar altura en el hilo JS. Al cerrar, mantener temporalmente el alto total de la sección mientras se reduce la ventana, y liberar el espacio con una animación separada, más lenta que el pliegue, que comience solo en el callback real de fin del pliegue; no permitir un nuevo toque hasta completar también esta fase. El giro y círculos arrancan inmediatamente desde el toque. Al abrir, el scroll también espera al panel.

Al abrir el panel con “+”, dejar que termine primero el despliegue; solo después desplazar suavemente la pantalla que contiene el muro un poco si la parte inferior queda fuera del área visible. El arrastre manual del usuario tiene prioridad. No desplazar automáticamente al cerrarlo ni competir con el posicionamiento para escribir cuando se abre desde otro acceso.

**Why:** El panel podía crecer fuera de la pantalla mientras el scroll quedaba quieto, pero sincronizar el scroll a cada fotograma del despliegue produjo lag al pulsar “+”. El usuario prefirió movimientos secuenciales y aclaró que no quería esperar al rebote final de la “+”. Una apertura de altura apenas más corta que el rebote seguía pareciendo la misma espera.

**How to apply:** Mantener la duración de la altura independiente y perceptiblemente más corta que la del rebote. Esperar la finalización real de esa altura, no la del grupo de animaciones de la “+”; hacer entonces un solo scroll nativo animado y moderado si hace falta, y descartarlo si el usuario empezó a desplazar manualmente.

Al tocar el campo para escribir, la secuencia deseada es distinta de la apertura con “+”: primero completar un único desplazamiento suave de la pantalla que contiene el muro hasta dejar los botones por encima de donde aparecerá el teclado; solo entonces enfocar y mostrar el teclado, sin otro empujón de la pantalla.

**Why:** El usuario observó que el scroll previo a foco apenas subía y el ajuste automático al abrir el teclado producía un segundo movimiento brusco. Incrementar la separación del teclado en varias ocasiones no resolvió la secuencia porque solo aumentaba el segundo movimiento. Confirmó que completar el scroll antes de mostrar el teclado y suprimir el ajuste automático funciona, pero la primera reserva conservadora subía demasiado la tarjeta.

**How to apply:** Para escribir, calcular el destino del scroll desde el borde visible real de la tarjeta (no sumar su margen inferior ni imponer una altura mínima si ya está desplegada); el objetivo pedido es dejar 15 px hasta el borde superior del teclado. Usar la altura medida del teclado cuando se conozca y solo una estimación inicial si aún no apareció. Dar espacio de scroll suficiente antes de enfocar, esperar a que termine el desplazamiento nativo y suspender el ajuste automático del teclado durante esa escritura; conservar el espacio extra hasta que termine de ocultarse el teclado para evitar saltos al cerrar.

La activación de escritura no debe depender del fin global de las interacciones o de una respuesta indefinida de las mediciones nativas, ni reiniciar su espera ante solicitudes duplicadas.

**Why:** El usuario reportó que tocar el campo no abría el teclado, y luego precisó que el cursor aparecía pero el teclado demoraba segundos. Los registros mostraron varias solicitudes antes de la apertura: los distintos eventos de un gesto y los toques repetidos no deben prolongar la espera. En una pantalla con animaciones, esperar reposo global puede bloquear la solicitud; un respaldo limitado al final del scroll tampoco cubre una medición que nunca responde.

**How to apply:** Conservar un único desplazamiento previo por apertura y agrupar las solicitudes mientras está pendiente, sin reiniciar su plazo. Abrir al llegar al destino o terminar realmente el scroll, incluso si el sistema limitó su recorrido; los respaldos largos son solo para eventos o medidas ausentes. Garantizar una salida desde antes de medir y cancelarla si el usuario arrastra, cambia de pantalla o se desmonta la sección, para no abrir el teclado después.

La escritura debe depender del panel disponible y del input nativo listo, no del fin del giro decorativo de la “+”. Una solicitud de foco emitida no demuestra que el teclado se abrió.

**Why:** El usuario volvió a reportar el fallo en Perfil después de corregir la espera del scroll y después de corregir el foco programático. Las comprobaciones anteriores terminaban en la solicitud de foco o simulaban el toque del contenedor, sin recorrer el toque nativo sobre el TextInput. React Native puede ignorar el foco de un input no editable o ya enfocado con el teclado oculto.

**How to apply:** Verificar la cadena completa desde el toque sobre el campo hasta el teclado, incluso si la animación decorativa nunca termina. No confundir cursor enfocado con teclado visible ni bloquear los toques nativos para retrasar el teclado. Conservar el scroll previo y el límite gratuito; contemplar la restauración del teclado cuando el sistema conserva el foco. Las pruebas simuladas y la compilación no confirman el resultado en el teléfono.