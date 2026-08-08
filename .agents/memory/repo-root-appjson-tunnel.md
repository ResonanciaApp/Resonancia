---
name: Root app.json breaks expo tunnel
description: El repo root tiene un app.json propio que hace que expo start use el projectRoot incorrecto cuando se ejecuta desde la raíz.
---

## El problema

`/home/runner/workspace/app.json` existe con:
- `extra.eas.projectId: ba32c5a5-ef84-46d9-93d0-dd7f70ef5923` (distinto al de mobile)
- `android.package: com.casadelcuenco.app` (distinto al de mobile)

Cuando `expo start` se ejecuta desde `/home/runner/workspace/` (la raíz del repo), lo encuentra y establece `projectRoot = /home/runner/workspace`. Metro entonces usa `/home/runner/workspace/.` como `originModulePath` virtual → `UnableToResolveError` porque `expo-router/entry` no está en la raíz.

**Síntoma en el bundler:** `originModulePath: "/home/runner/workspace/."` en el stack del error.

## La regla

`expo start` para el teléfono físico (tunnel) **siempre debe ejecutarse desde `artifacts/mobile/`**:

```bash
cd /home/runner/workspace/artifacts/mobile
pnpm exec expo start --dev-client --tunnel --clear
```

## Env vars del workflow — NO usar con tunnel

El dev script del workflow incluye:
```
EXPO_PACKAGER_PROXY_URL=https://$REPLIT_EXPO_DEV_DOMAIN
REACT_NATIVE_PACKAGER_HOSTNAME=$REPLIT_DEV_DOMAIN
```

Estas vars son solo para el modo `--localhost` del Replit preview. Con `--tunnel` sobreescriben la URL ngrok con el dominio Replit → el dev client no puede conectar. Como no están en el entorno global, solo afectan si se copia el comando del workflow.

**Why:** El repo es un monorepo pnpm; la raíz necesita su propio `app.json` por razones de tooling, pero ese archivo confunde a expo si se invoca desde ahí.

**How to apply:** Cada vez que alguien reporte `UnableToResolveError` con `originModulePath` apuntando a la raíz del repo, verificar desde dónde se ejecutó `expo start`.
