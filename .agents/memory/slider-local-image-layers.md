---
name: Slider local sin frames negros
description: Patrón estable para transiciones de carruseles con imágenes locales y cambios de foco.
---

Para carruseles con assets locales, mantener cada imagen montada como `Image` nativo y animar la opacidad de un contenedor persistente. La imagen visible no se oculta hasta que la capa destino confirma su carga.

**Why:** Remontar `expo-image` al cambiar `source` mientras se reutilizaba una opacidad animada dejó slides negros; la imagen solo reaparecía cuando cambiar de pestaña forzaba otro render.

**How to apply:** Separar índice deseado e índice visible, ignorar cargas tardías obsoletas, estabilizar una sola capa a opacidad 1 al perder foco y reanudar transiciones pendientes solo al recuperar foco.