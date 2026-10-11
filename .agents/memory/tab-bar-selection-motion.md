---
name: Selección animada del tab bar
description: Por qué el selector sigue la navegación confirmada y conserva su movimiento al cambiar de destino.
---

El selector debe responder a la ruta activa confirmada, no adelantarse al tap.
Las rutas ocultas y los overlays conservan la última pestaña real seleccionada.

**Why:** un tap puede cerrar un overlay o ser cancelado por navegación. Mover
el selector antes de confirmar el destino puede indicar una pantalla que no
se abrió.

**How to apply:** mantener una sola posición animada en el hilo UI; un cambio
rápido de destino continúa desde su posición visible actual, no con un salto
desde la posición del tab anterior. La distancia influye en el resorte, pero
los viajes Inicio–Perfil deben tener un rebote contenido y nunca salir de la
barra: el usuario corrigió expresamente el exceso de inercia entre extremos.
No reiniciar el selector ni añadir otra animación horizontal.

Al ampliar la cápsula, revisar también el margen disponible para el rebote.
Un límite duro de posición puede crear una pausa visible mientras el resorte
sigue avanzando fuera del límite; contenerlo progresivamente, sin congelarlo.

**Why:** los incrementos de ancho reducen el espacio de rebote aunque no cambie
la configuración del resorte. Las pruebas de límites por sí solas no detectan
esa pausa.

**How to apply:** comprobar continuidad del movimiento junto al borde y en
cambios rápidos de destino. Si se comprime la posición al dibujar, no volver
a comprimir esa misma posición al redirigir la animación.

El usuario confirmó trabas durante el recorrido en iPhone, incluso alternando
pantallas ya abiertas; no atribuir ese síntoma al rebote ni a la primera carga.

**Why:** suavizar el límite y separar las capas de sombra no resolvieron el
problema reportado. Una prueba de continuidad matemática no demuestra fluidez
en el dispositivo.

**How to apply:** conservar dimensiones y efectos. Separar el vidrio y su
sombra de la capa móvil; enviar solo transformaciones durante el resorte,
no propiedades de layout constantes. Estas medidas reducen trabajo de dibujo,
pero no declarar resuelto el lag sin comprobar el movimiento en un teléfono.

El indicador de iOS usa el controlador nativo de Animated como prueba dirigida,
sin trasladar el resto del tab bar ni cambiar navegación o diseño.

**Why:** evita el mecanismo de pausa de commits de Reanimated durante
actualizaciones de React. Es una hipótesis de rendimiento, no una causa
confirmada por un perfilado nativo ni una mejora confirmada por el usuario.

**How to apply:** no reintroducir Reanimated en ese indicador sin medir primero;
conservar la posición nativa al interrumpir, invalidar callbacks antiguos y
respetar Reducir movimiento.
