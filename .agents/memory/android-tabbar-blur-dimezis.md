---
name: Android tab bar blur (dimezis)
description: Estado del glassmorphism del tab bar/miniplayer en Android — qué se probó y qué queda
---
Blur `experimentalBlurMethod="dimezisBlurView"` (expo-blur) en el tab bar de mobile:

- SÍ funciona en el dispositivo del usuario (probado con franja simple absoluta sin transform/radius): el método no está roto en la tablet.
- NO se dibuja dentro de la barra pese a: quitar `elevation` en Android, dar borderRadius+overflow al propio BlurView, poner overflow "visible" en el contenedor, meter los tintes como hijos del BlurView. Sospechoso restante NO confirmado: el `transform: translateY` del Animated.View contenedor (prueba A/B quedó pendiente; el usuario la canceló).
- La barra inferior usa blur con superficie azul-marina semitransparente en todas las plataformas. No reintroducir brillos ni tintes laterales.
- La intensidad puede ser mayor en Android para compensar la implementación nativa, siempre que la barra permanezca fuera de ancestros transformados.

**Why:** el usuario ve la barra sólida en la tablet aunque el blur funciona fuera de ella; los tintes encima la hacían ver "sólida" incluso sin blur.
**How to apply:** conservar el BlurView y la barra fuera de todo ancestro transformado. Ajustar la opacidad de la superficie uniforme para controlar cuánto contenido se percibe detrás, sin añadir overlays laterales.

**Update (ago 2026):** un ancestro con transform (p.ej. wrapper de parallax alrededor de <Tabs>) hace que el blur dimezis dibuje una copia fantasma de la propia barra desplazada. Fix estructural: la barra (y CategoryOverlay) se renderizan FUERA del wrapper con parallax, vía TabBarPropsBridge que captura las props del tabBar en estado del layout. La barra nunca debe tener ancestros transformados.
