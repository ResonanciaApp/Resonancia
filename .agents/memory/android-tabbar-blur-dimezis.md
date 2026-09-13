---
name: Android tab bar blur (dimezis)
description: Estado del glassmorphism del tab bar/miniplayer en Android — qué se probó y qué queda
---
Blur `experimentalBlurMethod="dimezisBlurView"` (expo-blur) en el tab bar de mobile:

- SÍ funciona en el dispositivo del usuario (probado con franja simple absoluta sin transform/radius): el método no está roto en la tablet.
- NO se dibuja dentro de la barra pese a: quitar `elevation` en Android, dar borderRadius+overflow al propio BlurView, poner overflow "visible" en el contenedor, meter los tintes como hijos del BlurView. Sospechoso restante NO confirmado: el `transform: translateY` del Animated.View contenedor (prueba A/B quedó pendiente; el usuario la canceló).
- Decisión actual: la barra inferior no usa blur, transparencia ni líneas de separación; conserva únicamente su color sólido.

**Why:** el usuario ve la barra sólida en la tablet aunque el blur funciona fuera de ella; los tintes encima la hacían ver "sólida" incluso sin blur.
**How to apply:** mantener la barra fuera de todo ancestro transformado y no añadir BlurView, overlays translúcidos ni efectos visuales salvo que el usuario vuelva a pedirlo explícitamente.

**Update (ago 2026):** un ancestro con transform (p.ej. wrapper de parallax alrededor de <Tabs>) hace que el blur dimezis dibuje una copia fantasma de la propia barra desplazada. Fix estructural: la barra (y CategoryOverlay) se renderizan FUERA del wrapper con parallax, vía TabBarPropsBridge que captura las props del tabBar en estado del layout. La barra nunca debe tener ancestros transformados.
