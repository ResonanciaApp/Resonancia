---
name: Manrope fuente global (mobile)
description: Cómo se aplica Manrope por defecto en la app Expo y qué enfoques NO funcionan
---

La fuente global Manrope se inyecta parchando `StyleSheet.create` en `app/_layout.tsx`: cada estilo objeto sin `fontFamily` recibe `fontFamily:"Manrope"`.

**Por qué este enfoque y no otros:**
- Parchar `Text.render`/`TextInput.render` NO funciona en RN 0.81: `Text` y `TextInput` se exportan como function components sin `.render` — el patch se salta en silencio y la app entera pierde Manrope (regresión detectada por code review, ago 2026).
- El patch de StyleSheet NO rompe los íconos de @expo/vector-icons: la lib pone su fontFamily DESPUÉS del estilo del usuario (`[styleDefaults, style, styleOverrides]`), así que siempre gana. El tofu de íconos de ago 2026 era otra cosa (assets bajados por http — ver dev-client-http-assets-corrupt.md).

**How to apply:** no "modernizar" el patch de StyleSheet sin verificar en dispositivo que un `<Text>` sin estilo sigue saliendo en Manrope.
