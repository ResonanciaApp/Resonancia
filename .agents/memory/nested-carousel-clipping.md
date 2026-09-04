---
name: Carruseles anidados y clipping
description: Regla de rendimiento para pantallas verticales con varios carruseles horizontales
---

En Dormir, no activar `removeClippedSubviews` en los carruseles horizontales ni envolver sus secciones en una lista vertical virtualizada. Mantener la misma composición probada de Sonidos: header fijo fuera del `ScrollView`, contenido con `paddingTop` medido y cards del ancho estándar de contenido.

**Why:** fijar el header, reducir las cards, pausar los ocho loops del fondo y retirar la suscripción huérfana al timer mejoró el lag, pero no lo eliminó. La decisión confirmada fue quitar el fondo geométrico de Dormir por completo.

**How to apply:** usar `Pressable` normal, header absoluto medido y ancho estándar. Dormir no debe montar `GeoUniverseBackground` ni suscribirse a contextos de audio/timer; esos ticks deben quedarse en componentes pequeños.