---
name: Adopción de la biografía pública
description: Por qué los valores locales vacíos de una instalación antigua no equivalen a una orden de borrar la biografía pública.
---

Al habilitar la sincronización pública, una descripción local vacía puede ser un valor por defecto antiguo, mientras que el servidor ya conserva una descripción editorial válida. La primera adopción debe conservar ese contenido; después, un borrado explícito sí debe propagarse.

**Why:** Antes del perfil espejo, el lema y la descripción personales vivían localmente y la descripción pública podía haberse cargado desde Admin. Publicar los valores vacíos antiguos al abrir la app borraría contenido sin una acción del usuario.

**How to apply:** Distinguir primera adopción, contenido sincronizado sin cambios y ediciones locales pendientes. Recuperar cambios remotos cuando el usuario no ha editado, preservar los pendientes y no trasladar la biografía entre cuentas. Los formularios deben conservar sus borradores aunque llegue una actualización remota.

Las reglas detalladas del formulario propio —incluidos avatar, confirmación de descarte, cierre tras guardar y descripción sin recorte visual— están en [Edición y borradores de Perfil](profile-account-description.md).
