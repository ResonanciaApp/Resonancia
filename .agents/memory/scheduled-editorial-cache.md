---
name: Caché editorial programada
description: Diferenciar retirada y bloqueo temporal al conservar publicaciones fechadas en caché.
---

Una retirada editorial y un bloqueo por fecha futura necesitan reglas de caché distintas: ambos invalidan respuestas anteriores, pero la fecha futura debe poder desbloquear la misma revisión cuando un nuevo pedido al servidor lo autorice.

**Why:** Tratar todo bloqueo como retirada permanente impide estrenar una publicación programada que no cambió de revisión. No invalidar las respuestas anteriores permite que una petición demorada vuelva a mostrar contenido que el servidor acaba de bloquear.

**How to apply:** En nuevas lecturas o superficies de Inspiración diaria, conservar la autorización temporal del servidor y el orden de las peticiones; nunca usar el reloj del dispositivo como permiso para desbloquear contenido. Probar tanto respuestas fuera de orden como el estreno de la misma revisión al llegar la fecha.