---
name: Muro expansivo optimista
description: Reglas de actualización inmediata al crear o borrar mensajes de Mi viaje interior.
---

Guardar una reflexión debe insertarla inmediatamente en cualquier caché compatible del Muro expansivo. Borrar debe ocultar la card de inmediato, antes de cerrar el editor, sin esperar la respuesta del servidor.

**Why:** Invalidar sin actualizar conserva temporalmente una respuesta vacía y hace parpadear el placeholder al entrar al muro. Esperar el DELETE deja visible el editor y hace que la acción parezca lenta.

**How to apply:** Al crear, insertar la reflexión solo en páginas cuyo mes y categoría coincidan y luego revalidar. Al borrar, retirar optimísticamente de caché y páginas locales; restaurar la card y el editor únicamente si falla la petición.

El aviso de mensaje registrado en el muro de Perfil debe seguir el retraso y
el color de la confirmación de actividad añadida de Mi rutina. La vibración
es de intensidad media y ocurre al aparecer el aviso, no al comenzar la espera.

**Why:** El usuario pidió explícitamente que ambas confirmaciones se comporten
igual y que la vibración acompañe la aparición del mensaje del muro.

**How to apply:** Mantener sincronizados el retraso y la superficie de ambas
confirmaciones, y cancelar la entrada pendiente al cerrar la pantalla o sustituir
el aviso, para evitar vibraciones sin un mensaje visible.