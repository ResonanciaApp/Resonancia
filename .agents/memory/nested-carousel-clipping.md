---
name: Carruseles anidados y clipping
description: Regla de rendimiento para pantallas verticales con varios carruseles horizontales
---

En Dormir, no activar `removeClippedSubviews` en los carruseles horizontales ni envolver sus secciones en una lista vertical virtualizada. Mantener la misma estructura de `ScrollView` vertical + carruseles horizontales que usa Sonidos.

**Why:** ambos enfoques empeoraron el rendimiento en el dispositivo. La diferencia relevante frente a Sonidos era exclusiva de Dormir: los pills instalaban un `PanResponder` que competía con el scroll y el fondo se pausaba/reanudaba mediante estado React al iniciar y terminar cada gesto.

**How to apply:** usar interacción normal de `Pressable` en los pills y dejar el fondo sin toggles de estado ligados al scroll. Conservar arrays, callbacks y estilos estables; no “optimizar” esta composición cambiando el contenedor vertical o el clipping nativo.