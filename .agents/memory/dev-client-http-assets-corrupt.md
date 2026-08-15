---
name: Dev client con URL http = assets corruptos
description: Íconos tofu + imágenes/secciones vacías en un dispositivo específico cuando el dev client se conectó por http en vez de https
---

Síntoma: en UN dispositivo, todos los íconos de @expo/vector-icons salen como cajitas/glifos cambiados y faltan imágenes/secciones, mientras `useFonts` reporta loaded=true, getLoadedFonts lista las familias, y otros dispositivos se ven perfectos.

Causa: el usuario conectó el dev client escribiendo la URL del túnel `*.expo.riker.replit.dev` SIN https:// → scriptURL queda http://. El bundle JS pasa, pero los assets (TTF de íconos, imágenes bundleadas) se descargan como página HTML de redirección (¡Android registra la "fuente" corrupta en silencio con Typeface por defecto!). Los archivos malos quedan CACHEADOS en `ExponentAsset-<hash>.ttf`.

Diagnóstico concluyente: bajar el asset con Asset.downloadAsync y loggear los primeros bytes del localUri — `3c 61 20 68` ("<a h") = HTML; un TTF válido empieza `00 01 00 00`.

Fix (usuario): 1) Ajustes Android → Apps → app → Almacenamiento → borrar CACHÉ (purga los assets corruptos), 2) reconectar escribiendo la URL con `https://` explícito.

**How to apply:** si un solo dispositivo Android muestra tofu/imágenes vacías con fuentes "cargadas", pedir la URL con la que se conectó y revisar el scheme del asset uri en los logs antes de tocar código.
