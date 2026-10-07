---
name: Galería de historias iniciadas
description: Semántica durable del historial personal de historias de reflexión enviadas al flujo de Instagram.
---

La galería registra una composición cuando la persona confirma “Abrir Instagram”. Ese evento significa que el envío se inició; nunca debe presentarse como confirmación de publicación. Se conserva un snapshot reconstruible de texto, categoría, slot de fondo y transformaciones, no un PNG permanente.

**Why:** Instagram y el sistema operativo no informan de forma fiable si la historia terminó publicada. Guardar antes de preparar la imagen crea falsos registros; guardar después de abrir Instagram no tiene un callback fiable.

**How to apply:** Preparar primero la imagen, persistir antes de consultar o cargar integraciones nativas y usar una clave idempotente por payload/intento para que reintentos no dupliquen. Probar módulos opcionales con una consulta no fatal antes de importarlos; si faltan, abrir el selector de compartir del sistema. El detalle de galería es una ruta y debe renderizar el visor embebido, nunca otro Modal; sembrar su caché desde la card para evitar un frame vacío. La galería es privada por cuenta y cualquier paginación/caché debe excluir datos de otra identidad incluso antes de que corran effects.

Las historias deben conservar la imagen concreta del avatar, no resolver el avatar actual ni un preset editorial mutable al volver a compartir.

**Why:** Cambiar el avatar de Perfil o editar su catálogo no debe alterar una historia anterior. La receta también es una referencia de retención para evitar que una limpieza editorial borre una imagen todavía utilizada.

**How to apply:** Persistir una ruta de imagen estable; subir primero las imágenes locales o externas y validar propiedad o acceso público antes de referenciarlas. No conceder lectura pública por aparecer en una receta privada. Esperar la carga del avatar y del fondo antes de capturar.

El avatar es una capa movible independiente: no queda unido al bloque de la frase ni al fondo.

**Why:** El usuario corrigió expresamente la colocación fija debajo de la frase: la persona debe poder elegir cualquier ubicación dentro de la imagen.

**How to apply:** Mantener posición normalizada propia en vista previa, captura y receta guardada. Reservar el diseño antiguo debajo de la frase solo para historias previas sin coordenadas.

El avatar dentro de la imagen compartida se muestra sin borde ni overlay, con sus colores originales.

**Why:** El usuario pidió expresamente que fuera solo el avatar sin modificaciones.

**How to apply:** No agregar tintes, oscurecimiento ni marcos a la capa del avatar en la vista previa o captura. Esta regla no cambia el indicador de selección del botón del compositor.