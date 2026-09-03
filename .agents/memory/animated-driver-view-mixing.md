---
name: Animated drivers no se mezclan por View
description: Restricción de React Native Animated al combinar colores JS y transforms nativos en un mismo nodo visual.
---

No aplicar en el mismo `Animated.View` un estilo de color animado con `useNativeDriver: false` y una transformación u opacidad animada con `useNativeDriver: true`, aunque provengan de instancias de `Animated.Value` diferentes. Separar el color en una capa hija absoluta y dejar la transformación nativa en el contenedor.

**Why:** React Native puede asociar el nodo completo de propiedades visuales al driver nativo cuando comienza la transformación. Al iniciar después el color por JS, la app crashea con “Attempting to run JS driven animation on animated node that has been moved to native”.

**How to apply:** En pills o cards que combinan feedback de escala y transición de fondo, usar un contenedor animado para `transform` y un `Animated.View` hijo con `StyleSheet.absoluteFill` para `backgroundColor`.