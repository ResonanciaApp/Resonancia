---
name: Gate Premium global y modales nativos
description: Regla de UX y capas para abrir la oferta Premium desde cualquier contenido bloqueado.
---

Todo toque sobre contenido o una función bloqueada para usuarios gratuitos debe abrir directamente la oferta existente de Premium con tres planes. No debe mostrar primero una alerta de confirmación ni cargar una versión parcial del contenido.

**Why:** En iOS, un Modal nativo hermano no aparece de forma fiable encima de otro Modal ya presentado. La navegación global podía quedar detrás de Mezclador, buscadores, timers y hojas de acciones.

**How to apply:** Usar el punto de entrada Premium global. Si el control bloqueado vive dentro de un Modal nativo, ese Modal debe registrar un host Premium y renderizar la superficie de oferta dentro de su propia ventana. No cerrar el host antes de abrir la oferta; Atrás debe cerrar primero la oferta.