---
name: Metro require inside try-catch
description: Metro resuelve TODOS los require() incluso dentro de try-catch; patrón de SDK nativo condicional debe usar código comentado, no require dinámico.
---

# Metro no ignora require() en try-catch

## La regla
No usar `require('uninstalled-native-package')` dentro de try-catch para simular carga condicional. Metro resuelve **todos** los `require()` en tiempo de bundle, independientemente de si están dentro de un bloque try-catch. Si el paquete no está instalado, el bundle falla.

**Why:** Metro construye el grafo de módulos estáticamente al analizar el código. El análisis no evalúa la lógica de runtime; simplemente encuentra todos los `require()` y los resuelve.

**How to apply:**
- Para SDKs nativos opcionales (ej. `@daily-co/react-native-daily-js`) que requieren rebuild del dev client: mantener el import comentado con una marca clara (ej. `// SDK_NATIVE_INTEGRATION`) + una constante booleana `SDK_AVAILABLE = false` que controla el flujo en runtime.
- Cuando el SDK esté instalado y el dev client reconstruido, descomentar el import y cambiar `SDK_AVAILABLE = true`.
- Nunca usar `require()` condicional a runtime para módulos nativos NO instalados (no están en el bundle).
- **PARA módulos instalados pero sin nativo en el dev client** (ej. `react-native-audio-api`): usar `require("X")` síncrono dentro de un try-catch síncrono — NO `await import()`. El error de inicialización de módulo en Hermes/Metro puede escaparse del async try-catch antes de propagarse como "Uncaught Error". El try-catch síncrono sí lo captura siempre. Metro incluye el JS en el bundle igualmente (el problema es solo el código nativo ausente en el binario compilado).
