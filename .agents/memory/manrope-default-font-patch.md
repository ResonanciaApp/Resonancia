---
name: Manrope fuente global (mobile)
description: Cómo se aplica Manrope por defecto en la app Expo y qué enfoques NO funcionan
---

La fuente global Manrope se inyecta en `Text.render`/`TextInput.render` en `app/_layout.tsx`, con el estilo base primero para que una fuente explícita del componente tenga prioridad.

**Por qué este enfoque y no otros:**
- Parchar `StyleSheet.create` rompe la inferencia específica de cada estilo: una hoja con un peso inválido puede devolver `ViewStyle | TextStyle | ImageStyle` y generar cientos de errores en cascada.
- Los pesos personalizados como `"380"`/`"450"` no forman parte del contrato de React Native; usar `"400"` o `"500"` evita que `StyleSheet.create` caiga en su unión genérica.
- Los íconos de `@expo/vector-icons` conservan su fuente porque el estilo explícito del ícono se aplica después del estilo base. El tofu de íconos era otra cosa (assets bajados por http — ver dev-client-http-assets-corrupt.md).

**How to apply:** no parchear `StyleSheet.create`; si se añaden pesos intermedios, mapearlos a los valores admitidos por la versión de React Native antes de ejecutar el typecheck.
