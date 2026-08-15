---
name: eas-cli config spawn falla sin NODE_PATH
description: eas build falla con "expo/bin/cli config --json exited with non-zero code 1" (silencioso) bajo pnpm
---
Regla: si `eas build` muere con `expo/bin/cli config --json exited with non-zero code: 1` sin mensaje, pero `npx expo config --json` funciona, el problema es NODE_PATH.

**Why:** eas-cli spawnea el bin de expo directo (sin el shim de pnpm). El shim `node_modules/.bin/expo` exporta NODE_PATH apuntando a los node_modules del instance de .pnpm; sin eso el cli sale 1 en silencio (stderr vacío). Además la instancia de expo del root puede ser un híbrido sucio (expo@54 con peers de SDK 57) tras los bumps externos.

**How to apply:** copiar el `export NODE_PATH=...` desde `node_modules/.bin/expo` (las 3 rutas) y correr `NODE_PATH=... npx eas-cli build ...`. Verificar antes que `npx expo config --json` pase.

Contexto extra (15-ago-2026): la APK Android del 8-ago quedó rota de fábrica (NoClassDefFoundError expo.modules.kotlin.types.AnyTypeCache al cargar el proyecto) — compilada durante el caos de deps; la solución fue rebuild limpio en SDK 54, no tocar el device.
