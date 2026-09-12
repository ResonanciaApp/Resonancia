---
name: Expo dev bundle con entrada local
description: Por qué la app móvil usa un punto de entrada local para acortar la URL del bundle de desarrollo.
---

La app móvil debe mantener un archivo de entrada local que importe `expo-router/entry`, en vez de declarar directamente el paquete como `main`. En este workspace, el proxy de Metro debe publicar además con el dominio normal de desarrollo, no con el subdominio `.expo.`.

**Why:** Primero, el manifiesto de Expo resolvía el punto de entrada a una ruta física muy larga dentro de pnpm. Después de acortarla, el iPhone seguía recibiendo el manifiesto pero no podía descargar bundles desde el subdominio `.expo.riker.replit.dev`; sí alcanzaba el dominio normal `.riker.replit.dev`.

**How to apply:** Mantener `main` apuntando al archivo local y `EXPO_PACKAGER_PROXY_URL` en el dominio normal de desarrollo. Tras cambiarlo, reiniciar Expo y salir de cualquier pantalla RCTFatal anterior; “Reload JS” reutiliza la URL vieja y no solicita el manifiesto corregido.