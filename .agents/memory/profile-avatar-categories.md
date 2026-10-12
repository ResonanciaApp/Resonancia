---
name: Categorías de avatares de Perfil
description: Pertenencia editorial múltiple confirmada por el usuario.
---

Las categorías de avatares de Perfil no son exclusivas: un mismo avatar puede pertenecer a varias a la vez.

**Why:** El usuario eligió expresamente «Varias categorías» frente a una asignación única.

**How to apply:** Al asignar o retirar una categoría, preservar las otras pertenencias. Los filtros muestran el mismo avatar dentro de cualquiera de sus categorías, sin duplicarlo en la vista general.

El orden editorial elegido en Admin debe ser compartido con la app, también cuando se genera aleatoriamente; no debe volver a barajarse por usuario o al abrir el selector.

**Why:** El usuario pidió que los cambios de orden del Admin se reflejen en la app. Un sorteo independiente en cada cliente rompería esa correspondencia.

**How to apply:** Tratar Aleatorio e Intercalado como formas de preparar un orden para guardar, conservando la posibilidad de ajustarlo manualmente.

La ventana móvil de Portada de avatares se cierra al deslizarla hacia abajo o al tocar el fondo externo situado arriba de la ventana; los espacios vacíos internos no la cierran.

**Why:** El usuario retiró el cierre por tacto general para evitar cierres accidentales, pero posteriormente pidió habilitarlo específicamente en el fondo externo superior.

**How to apply:** Limitar el área de cierre por tacto al fondo superior externo. Mantener el gesto descendente coordinado con el scroll: desde la cabecera siempre, y desde la grilla solo cuando está en el inicio. Un gesto corto vuelve suavemente a su posición.

Las pruebas de callbacks aislados no demuestran que el dispositivo reconozca el gesto de cierre de Portada.

**Why:** La lógica de cierre pasaba las pruebas, pero el usuario seguía atrapado en la ventana porque el arrastre real no se reconocía.

**How to apply:** Distinguir siempre lógica y compilación de verificación interactiva nativa. No afirmar que el cierre funciona en iPhone ni que es fluido sin haber probado el arrastre real.

Al mover el filtro de categorías, comprobar la posición visible de texto y chevron, no solo la del contenedor, y mantener el desplegable anclado al control.

**Why:** El usuario reiteró que había pedido subir «Todos» y no había visto el movimiento. La alineación interna y el recorte pueden ocultar cambios en el contenedor.

El usuario confirmó que el cierre nativo por arrastre reconoce el gesto en su teléfono; la pausa al soltar es un problema separado.

**Why:** La ventana dejó de quedar atrapada al cambiar el reconocimiento, pero apareció una pausa entre el arrastre y la salida automática.

**How to apply:** Conservar el reconocimiento nativo confirmado. La continuación del gesto no debe esperar una actualización de React: movimiento y fade terminan en el hilo de animación antes de desmontar la ventana.

El avatar hero de Portada debe estar visible desde el comienzo, sin animación propia de aparición.

**Why:** El usuario reiteró que debe comportarse como las imágenes de la grilla y reportó parpadeo aunque ya no tuviera fade.

**How to apply:** No confundir la animación de la ventana con una animación del avatar. Preparar la imagen antes de abrir y evitar recargarla por una actualización editorial que no cambie su fuente real.

La presentación nativa y la carga del catálogo deben coordinarse: animar desde la confirmación de que el Modal está mostrado y no reconstruir la grilla mientras sale.

**Why:** El arrastre ya era nativo, pero la apertura coincidía con montaje masivo de imágenes y refrescos; cerrar con un filtro activo cambiaba la lista antes de terminar la salida. El usuario confirmó que coordinar la presentación y limitar esa carga dejó la apertura fluida casi el 100 % de las veces; la fluidez del cierre se evalúa por separado.

**How to apply:** Preparar filtros antes de presentar, acotar las filas anticipadas y esperar el fin real de apertura para refrescar datos. El diagnóstico del drawer por sí solo no atribuye pausas a Portada; distinguir los eventos de cada ventana.
