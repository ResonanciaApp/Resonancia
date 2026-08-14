---
name: Mobile package.json clobbered by external tooling
description: The mobile package.json can get rewritten (deps lost, dev script simplified) by external tooling, breaking the expo workflow
---
Síntoma: workflow expo falla con "expo: not found" + "node_modules missing"; `artifacts/mobile/package.json` aparece con version 1.0.0, sin devDependencies y con un script dev recortado (sin PORT/--localhost).
**Why:** herramientas externas (probablemente `eas init`/expo tooling corrido por el usuario, jul 2026) reescriben el package.json y desincronizan pnpm-lock.
**How to apply:** restaurar `artifacts/mobile/package.json` y `pnpm-lock.yaml` desde HEAD (`git show HEAD:<path>` + write), `pnpm install`, reiniciar workflow. Conservar cambios legítimos del usuario en app.json/eas.json.

Variante (ago 2026): el clobber puede ser un upgrade silencioso de SDK (expo ~54→~57, react-native 0.81→0.86, `react: catalog:`) en package.json + lockfile. Tras revertir a HEAD y reinstalar, expo puede fallar con "Cannot find module 'metro-runtime/package.json'" — el reinstall pierde el hoist. Fix permanente: `metro-runtime` (versión que empareja con la de RN, p. ej. 0.83.3 para RN 0.81.5) como devDependency explícita de mobile.
