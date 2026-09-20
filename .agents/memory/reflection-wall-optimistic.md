---
name: Muro expansivo optimista
description: Reglas de actualización inmediata al crear o borrar mensajes de Mi viaje interior.
---

Guardar una reflexión debe insertarla inmediatamente en cualquier caché compatible del Muro expansivo. Borrar debe ocultar la card de inmediato, antes de cerrar el editor, sin esperar la respuesta del servidor.

**Why:** Invalidar sin actualizar conserva temporalmente una respuesta vacía y hace parpadear el placeholder al entrar al muro. Esperar el DELETE deja visible el editor y hace que la acción parezca lenta.

**How to apply:** Al crear, insertar la reflexión solo en páginas cuyo mes y categoría coincidan y luego revalidar. Al borrar, retirar optimísticamente de caché y páginas locales; restaurar la card y el editor únicamente si falla la petición.