---
name: Fondos de historias de reflexión
description: Invariantes editoriales de los 100 fondos usados para compartir reflexiones.
---

Mi viaje interior usa exactamente 100 slots permanentes, identificados del 01 al 100. Una imagen subida reemplaza visualmente el fondo incluido del mismo slot; eliminarla restaura ese fondo incluido en vez de borrar el registro. El orden editorial puede cambiar, pero los slots no se crean, destruyen ni renumeran.

**Why:** Mobile necesita mantener siempre una grilla estable y una primera selección fiable, incluso si una imagen remota falla. Eliminar registros o tratar las imágenes como una lista variable desplaza la selección predeterminada y rompe el fallback.

**How to apply:** En cambios de API, Admin o Mobile para `reflection-story`, rechazar altas fuera de los 100 slots, preservar el orden del servidor, conservar un fallback bundleado por slot y tratar “Eliminar” como restauración del fondo incluido.