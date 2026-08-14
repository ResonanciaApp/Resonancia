---
name: expo-router version must track SDK line
description: expo-router 6.x breaks under floated @expo/cli 57; pin expo-router to the 57.x line
---
Regla: con expo SDK 57, expo-router debe ser de la línea 57.x (el versionado de expo-router pasó de 6.x a seguir el SDK). Si `@expo/cli` flota a una versión nueva (lockfile re-resuelto), su typed-routes requiere `expo-router/internal/routing`, que no existe en 6.x → el workflow expo crashea al arrancar con MODULE_NOT_FOUND.

**Why:** ago 2026 — pnpm re-resolvió @expo/cli 57.0.13 y expo-router seguía en ~6.0.24; `pnpm install` no lo arregla porque el rango en package.json era el problema.

**How to apply:** actualizar el rango en artifacts/mobile/package.json a la línea 57.x. Ojo: pnpm `minimumReleaseAge` puede bloquear en silencio la última versión (instala la vieja sin error visible) — verificar la versión instalada con `node -p require(...).version` y, si quedó vieja, pinear una versión exacta anterior (ej. 57.0.12). `npx expo install` falla vía pnpm en este monorepo; editar package.json a mano.
