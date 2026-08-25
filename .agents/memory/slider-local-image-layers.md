---
name: Slider local sin frames negros
description: Patrón estable para transiciones de carruseles con imágenes locales y cambios de foco.
---

Para carruseles con assets locales, mantener cada imagen montada como `Image` nativo y animar la opacidad de un contenedor persistente. La imagen visible no se oculta hasta que la capa destino confirma su carga.

**Why:** Remontar `expo-image` al cambiar `source` mientras se reutilizaba una opacidad animada dejó slides negros; la imagen solo reaparecía cuando cambiar de pestaña forzaba otro render.

**How to apply:** Separar índice deseado e índice visible, ignorar cargas tardías obsoletas, estabilizar una sola capa a opacidad 1 al perder foco y reanudar transiciones pendientes solo al recuperar foco.

## Contrato parallax de Inicio 2

Imagen, rayas de navegación, menú y loto comparten el desplazamiento parallax lento; al tirar hacia abajo solo la imagen se escala. El contenido avanza a velocidad normal, conserva el degradado del tema y termina cubriendo todo el hero.

**Why:** El usuario eligió explícitamente que menú y loto acompañen el parallax, en vez de desplazarse a la velocidad normal del contenido.

**How to apply:** Mantener una traslación común para todo el chrome del hero, separar la escala elástica de la imagen y usar un LinearGradient vertical limitado al alto de la ventana para cubrir el overflow sin aplanar el fondo por la altura total del contenido.