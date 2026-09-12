---
name: Expo dev bundle con entrada local
description: Por qué la app móvil usa un punto de entrada local para acortar la URL del bundle de desarrollo.
---

La app móvil debe mantener un archivo de entrada local que importe `expo-router/entry`, en vez de declarar directamente el paquete como `main`.

**Why:** El manifiesto de Expo resolvía el punto de entrada a una ruta física muy larga dentro de pnpm. El development build de iOS recibía el manifiesto, pero fallaba al descargar esa URL y mostraba “Could not connect to development server”.

**How to apply:** Mantener `main` apuntando al archivo local. Tras cambiar el punto de entrada, reiniciar Expo y salir de cualquier pantalla RCTFatal anterior; “Reload JS” reutiliza la URL vieja y no solicita el manifiesto corregido.