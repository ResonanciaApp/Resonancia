---
name: Carruseles anidados y clipping
description: Regla de rendimiento para pantallas verticales con varios carruseles horizontales
---

No activar `removeClippedSubviews` en carruseles horizontales pequeños que viven dentro de una lista vertical y usan márgenes horizontales negativos. En dispositivos reales puede aumentar el lag por detach/attach y relayout nativo, además de producir errores de clipping.

**Why:** al probarlo en Dormir, el rendimiento empeoró claramente en el dispositivo aunque las props de los carruseles ya fueran estables.

**How to apply:** mantener el clipping desactivado en los carruseles hijos y virtualizar la colección de secciones con una lista vertical. Conservar también arrays, callbacks y estilos estables para que cambios de estado del contenedor no invaliden la memoización.