---
name: Manrope default font patch
description: Cómo se inyecta Manrope como fuente por defecto en mobile y por qué NO debe hacerse vía StyleSheet.create
---

Regla: la fuente por defecto (Manrope) se inyecta parchando `Text.render`/`TextInput.render` en app/_layout.tsx, poniendo `{fontFamily:"Manrope"}` como PRIMER elemento del array de estilos.

**Why:** el enfoque anterior (parchar `StyleSheet.create` para agregar fontFamily a todo estilo que no la tuviera) inyectaba Manrope también en los estilos pasados a íconos de @expo/vector-icons, pisando su fontFamily ("Feather", "Ionicons"...). En Android los íconos salían como cajitas tofu o glifos aleatorios (iOS lo disimula con fallback por glifo). Además, precargar las fuentes de íconos con useFonts no arregla nada si la fontFamily queda pisada.

**How to apply:** cualquier "fuente global por defecto" en RN → estilo base primero en el array del render de Text, nunca reescribiendo estilos ajenos. Si reaparecen íconos tofu solo en Android con fuentes "loaded=true", buscar quién pisa fontFamily.
