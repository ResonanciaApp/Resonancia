---
name: Account deletion versus signed uploads
description: Garantía de borrado cuando existen URLs PUT firmadas que pueden usarse después del primer barrido.
---

Una eliminación de cuenta no debe marcar la limpieza de archivos como completa tras un único barrido si todavía puede existir una URL PUT firmada sin expirar. Hay que persistir las rutas antes de entregar la URL, bloquear nuevas emisiones al iniciar el borrado y repetir el borrado después del TTL máximo.

**Why:** Una ruta puede no existir durante el primer barrido y ser creada segundos después con una URL emitida antes de eliminar la cuenta. Sin una barrera temporal persistida, el API devolvería éxito dejando un archivo huérfano.

**How to apply:** Mantener un tombstone reintentable con las rutas y la fecha posterior a la última expiración posible. Un worker durable debe ejecutar el segundo barrido tras esa fecha y sólo entonces marcar la limpieza como completada.