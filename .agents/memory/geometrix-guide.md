---
name: Guía de decisiones de Geometrix
description: Índice de reglas durables de navegación, gestos, capas, historial y rendimiento de Geometrix.
---

Consultar las notas correspondientes antes de cambiar Geometrix:

- [Tab bar](tab-bar-hide-geometrix.md): conservar una forma de recuperar la navegación.
- [Landing y foco](geometrix-landing-focus-gate.md): detener loops cuando no tiene foco.
- [Zoom vectorial](geometrix-zoom-vector.md): conservar nitidez y grosor del trazo.
- [Panel superpuesto](geometrix-panel-overlay.md): abrir como panel, no como navegación a la tab.
- [Selección del carrusel](geometrix-carousel-selection.md): orden derivado y retorno al orden natural al deseleccionar.
- [Identidad de capas](geometrix-instance-ids.md): distinguir geometría base e instancia duplicada.
- [Rotación y gestos](geometrix-rotation-cardinal.md): evitar actualizaciones de React por frame.
- [Sincronización de rotación](geometrix-rotation-sync-effect.md): no pisar rotación al confirmar zoom simultáneo.
- [Sheet de ajustes](geometrix-settings-sheet.md): altura medida y separación entre ajustes y transformaciones.
- [Rendimiento del carrusel](geometrix-carousel-microlag.md): preservar el modelo de arrastre sin parpadeos.
- [Modo Hold](geometrix-hold-mode.md): aplicar gestos a todas las capas.
- [Historial de Atrás](geometrix-undo-history.md): agrupar cambios y conservar restauración por snapshots.
- [Filtro de categorías](geometrix-category-filter.md): preservar orden global entre categorías.
- [Trazo fino y rellenos](geometrix-thin-stroke.md): no tratar mosaicos rellenos como trazos.