---
name: Android tab bar blur (dimezis)
description: Estado del glassmorphism del tab bar/miniplayer en Android — qué se probó y qué queda
---
Blur `experimentalBlurMethod="dimezisBlurView"` (expo-blur) en el tab bar de mobile:

- SÍ funciona en el dispositivo del usuario (probado con franja simple absoluta sin transform/radius): el método no está roto en la tablet.
- NO se dibuja dentro de la barra pese a: quitar `elevation` en Android, dar borderRadius+overflow al propio BlurView, poner overflow "visible" en el contenedor, meter los tintes como hijos del BlurView. Sospechoso restante NO confirmado: el `transform: translateY` del Animated.View contenedor (prueba A/B quedó pendiente; el usuario la canceló).
- Decisión actual: en Android el tab bar y el MiniPlayer NO llevan tinte violeta ni tinte Universo (gateados por `Platform.OS !== "android"`); iOS conserva los tintes originales (0.15 violeta / 0.45 tibet).
- Intensidad: Android 100, iOS 40, en ambos componentes (`app/(tabs)/_layout.tsx` y `components/MiniPlayer.tsx`).

**Why:** el usuario ve la barra sólida en la tablet aunque el blur funciona fuera de ella; los tintes encima la hacían ver "sólida" incluso sin blur.
**How to apply:** si se retoma el glass en Android, probar sacar el BlurView del ancestro con transform (o animar sin transform) antes que tocar intensidades/tintes; no reintroducir tintes Android sin resolver la captura.

**Update (ago 2026):** un ancestro con transform (p.ej. wrapper de parallax alrededor de <Tabs>) hace que el blur dimezis dibuje una copia fantasma de la propia barra desplazada. Fix estructural: la barra (y CategoryOverlay) se renderizan FUERA del wrapper con parallax, vía TabBarPropsBridge que captura las props del tabBar en estado del layout. La barra nunca debe tener ancestros transformados.
