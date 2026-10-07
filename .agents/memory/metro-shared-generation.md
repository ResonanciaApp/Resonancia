---
name: Metro y generación compartida
description: Efecto de limpiar y regenerar clientes compartidos mientras Expo está observando sus módulos.
---

La generación de clientes compartidos borra temporalmente sus archivos antes de recrearlos. Expo puede observar ese intervalo, conservar errores de resolución y dejar la recarga en caliente en un estado inconsistente aunque la generación termine correctamente.

**Why:** Al regenerar el cliente compartido con Metro activo aparecieron errores de módulo ausente y de contexto de React. Los archivos finales eran válidos; un reinicio de Expo permitió compilar otra vez el bundle iOS correctamente.

**How to apply:** Terminar la generación antes de reiniciar sus consumidores, incluido Expo cuando esté activo. Distinguir archivos realmente ausentes de un error temporal del observador; no cambiar imports ni proveedores para compensar el intervalo de limpieza.
