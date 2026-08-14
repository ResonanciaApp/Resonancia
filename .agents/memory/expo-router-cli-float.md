---
name: expo-router version must track SDK line
description: expo-router 6.x breaks under floated @expo/cli 57; pin expo-router to the 57.x line
---
REGLA REAL (ago 2026): el dev client instalado en el device del usuario es **SDK 54** (expo ~54.0.36, RN 0.81.5, expo-router ~6.0.24). Cualquier bump del JS a SDK 57 crashea el device con "MessageQueue doesn't exist". Tooling externo ya subió mobile a SDK 57 dos veces ("Update mobile configuration and refresh lockfile dependencies"); el fix es `git checkout <commit SDK54> -- artifacts/mobile/package.json` + pnpm install + restart. NO subir de SDK hasta que el usuario recompile el dev client.

Contexto histórico (solo si algún día se migra a SDK 57): con expo SDK 57, expo-router debe ser de la línea 57.x (el versionado de expo-router pasó de 6.x a seguir el SDK). Si `@expo/cli` flota a una versión nueva (lockfile re-resuelto), su typed-routes requiere `expo-router/internal/routing`, que no existe en 6.x → el workflow expo crashea al arrancar con MODULE_NOT_FOUND.

**Why:** ago 2026 — pnpm re-resolvió @expo/cli 57.0.13 y expo-router seguía en ~6.0.24; `pnpm install` no lo arregla porque el rango en package.json era el problema.

**How to apply:** actualizar el rango en artifacts/mobile/package.json a la línea 57.x. Ojo: pnpm `minimumReleaseAge` puede bloquear en silencio la última versión (instala la vieja sin error visible) — verificar la versión instalada con `node -p require(...).version` y, si quedó vieja, pinear una versión exacta anterior (ej. 57.0.12). `npx expo install` falla vía pnpm en este monorepo; editar package.json a mano.

Secuela: tras el bump, el device crasheó con "[runtime not ready]: ReferenceError: Property 'MessageQueue' doesn't exist" — dos variantes peer de react-native en .pnpm (por @types/react 19.1.x vs 19.2.x) duplicaban RN en el bundle de Metro. Fix: override `"@types/react"` en la sección `overrides:` de **pnpm-workspace.yaml** (los overrides en package.json `pnpm.overrides` NO se aplican en este repo) + pnpm install + restart expo (--clear ya está en el comando). Verificar con `readlink artifacts/mobile/node_modules/react-native` vs el react-native del contexto pnpm de expo-router: deben apuntar a la MISMA instancia.
