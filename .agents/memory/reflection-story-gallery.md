---
name: Galería de historias iniciadas
description: Semántica durable del historial personal de historias de reflexión enviadas al flujo de Instagram.
---

La galería registra una composición cuando la persona confirma “Abrir Instagram”. Ese evento significa que el envío se inició; nunca debe presentarse como confirmación de publicación. Se conserva un snapshot reconstruible de texto, categoría, slot de fondo y transformaciones, no un PNG permanente.

**Why:** Instagram y el sistema operativo no informan de forma fiable si la historia terminó publicada. Guardar antes de preparar la imagen crea falsos registros; guardar después de abrir Instagram no tiene un callback fiable.

**How to apply:** Preparar primero la imagen, persistir antes de consultar o cargar integraciones nativas y usar una clave idempotente por payload/intento para que reintentos no dupliquen. Probar módulos opcionales con una consulta no fatal antes de importarlos; si faltan, abrir el selector de compartir del sistema. La galería es privada por cuenta y cualquier paginación/caché debe excluir datos de otra identidad incluso antes de que corran effects.