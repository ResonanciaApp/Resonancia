---
name: Bloqueo editorial de avatares
description: Alcance del control manual de avatares de Perfil y conservación de elecciones existentes.
---

El bloqueo de avatares es editorial y manual desde Admin. No activa desbloqueos automáticos por Tu camino, rachas o membresía, ni afecta a portadas de Mezclas, Playlists o Mi viaje interior.

**Why:** El usuario pidió poder bloquear y desbloquear las cards de Avatares de Perfil; la tarea aprobada excluye expresamente los desbloqueos por progreso y cambios a otras colecciones.

**How to apply:** Mantener la disponibilidad editorial independiente de las promesas visuales de recompensas de Tu camino hasta que el usuario pida conectar ambas.

Las cards de Avatares de Perfil del Admin deben conservar su presentación de tarjetas horizontales apiladas verticalmente, no un carrusel.

**Why:** El usuario aclaró que «tarjetas horizontales como estaba» se refiere a cada fila original; rechazó expresamente convertir el catálogo en un carrusel al añadir movimiento por lotes.

**How to apply:** Añadir selección y controles de reordenación sin cambiar el formato de las filas, las miniaturas ni la distribución de sus acciones.

El catálogo editorial de Perfil complementa la elección de una foto personal desde la galería del teléfono; no la sustituye. Cambiar una píldora por un icono no autoriza retirar esa acción.

**Why:** El usuario reiteró que el icono de imagen de Portada debe conservar la función de cargar una foto del celular que tenía la píldora anterior.

**How to apply:** Al rediseñar Portada o ampliar el catálogo, verificar también que el control de foto personal recibe el toque y mantiene el flujo de permisos, selección y guardado.

La visión futura del producto es desbloquear grupos de avatares de Perfil al avanzar de etapa en Tu camino, y darles usos personales y sociales después de desbloquearlos.

**Why:** El usuario describió explícitamente este objetivo al pedir ideas para aprovechar la colección, no solo para editar su foto.

**How to apply:** Tenerlo presente al diseñar recompensas e identidad. Esta exploración no autoriza implementar desbloqueos automáticos ni activar el progreso; el control editorial actual permanece hasta una petición de implementación.

Un bloqueo impide nuevas elecciones, pero conserva un avatar que el usuario ya tenía confirmado. No sustituirlo ni borrarlo retroactivamente.

**Why:** El alcance presentado al usuario conserva las elecciones existentes para evitar cambios involuntarios de identidad.

**How to apply:** Distinguir una nueva asignación de la conservación del mismo avatar al actualizar otros datos. Una elección rechazada no debe quedar guardada localmente como pendiente.

Reemplazar el catálogo editorial no debe cambiar los avatares ya confirmados ni dejar sus imágenes inaccesibles. Conservar los objetos anteriores y su acceso de lectura previamente público, aunque ya no estén en el selector.

**Why:** El acceso a una imagen editorial puede depender exclusivamente de su referencia en el catálogo. Al reemplazar esa referencia, conservar el archivo y la URL del usuario no basta: la lectura puede quedar denegada.

**How to apply:** Antes de sustituir o retirar avatares publicados, preservar su acceso legítimo y comprobar también una URL anterior después del cambio. Limitar este tratamiento a imágenes editoriales que ya eran públicas; nunca conceder acceso a cualquier objeto privado por una referencia arbitraria.

Al recortar avatares editoriales desde una lámina, todos deben tener el mismo tamaño y una máscara circular real, con el exterior transparente. No basta con que la ilustración parezca redonda.

**Why:** El usuario pidió expresamente avatares «100% redondos» aunque la imagen original no lo sea, y todos del mismo tamaño.

**How to apply:** Recortar sin deformar el dibujo, aplicar la misma máscara circular a todas las imágenes y comprobar que sus dimensiones y canales alfa coincidan antes de reemplazar los slots.

Para optimizar estos avatares editoriales, usar WebP sin pérdida de calidad, no compresión visual con calidad reducida.

**Why:** El usuario eligió la opción intermedia de la comparación: WebP sin pérdida, en lugar del PNG original o WebP con calidad 85.

**How to apply:** Conservar resolución, máscara y píxeles RGBA exactos; verificar la imagen decodificada antes de publicar. No pasar a compresión con pérdida sin una nueva indicación del usuario.

Una ampliación de capacidad del catálogo debe cubrir también el contrato de reordenación y su rango temporal, no solo el contador del Admin y la creación.

**Why:** Al ampliar Perfil, el orden seguía limitado a una colección pequeña y un desplazamiento temporal fijo colisionaba con posiciones ya ocupadas.

**How to apply:** Probar el guardado del orden con la capacidad máxima y reservar posiciones temporales por encima del máximo ocupado, manteniendo intactas las restricciones de otros catálogos.

Las pruebas de capacidad con avatares temporales deben limpiar sus fixtures incluso cuando falle una aserción, y comprobar después el catálogo que sirve la API real.

**Why:** Una prueba fallida dejó imágenes temporales visibles; una limpieza informada por otra consulta no bastó para demostrar que la API ya servía el catálogo correcto.

**How to apply:** Registrar todos los IDs temporales para limpieza incondicional y verificar el número y la identidad de los avatares desde el endpoint usado por Admin y Mobile.
