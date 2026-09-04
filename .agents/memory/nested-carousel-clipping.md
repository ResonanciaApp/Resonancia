---
name: Carruseles anidados y clipping
description: Regla de rendimiento para pantallas verticales con varios carruseles horizontales
---

En Dormir, no activar `removeClippedSubviews` en los carruseles horizontales ni envolver sus secciones en una lista vertical virtualizada. Mantener la misma composición probada de Sonidos: header fijo fuera del `ScrollView`, contenido con `paddingTop` medido y cards del ancho estándar de contenido.

**Why:** clipping y virtualización vertical empeoraron el rendimiento en el dispositivo. Quitar el `PanResponder` de los pills y los toggles React del fondo no bastó: Dormir seguía moviendo su header dentro del scroll y decodificaba cards más grandes que Sonidos.

**How to apply:** usar `Pressable` normal en los pills, fondo sin toggles de estado ligados al scroll, header absoluto medido fuera del scroll y el ancho estándar compartido. Conservar arrays, callbacks y estilos estables.