---
name: RN src/private/specs_DEPRECATED patch for StubComponent crash
description: Cómo resolver el crash "Tried to register two views with the same name StubComponent" en iOS dev client con Expo SDK 54 + RN mismatch.
---

## El problema

El dev client tiene RN@0.86.0 nativo. El JS bundle usa RN@0.81.5. Los archivos en
`src/private/specs_DEPRECATED/components/` de AMBAS versiones de RN contienen
`requireNativeComponent('StubComponent')` — el babel-plugin-codegen@0.81.5 no puede
parsear sus tipos Flow y los precompila con ese fallback. En runtime, múltiples módulos
intentan registrar el mismo nombre de vista → "Tried to register two views with the same
name StubComponent".

## Fix

Parchear todos los archivos JS en `src/private/specs_DEPRECATED/components/` de TODAS
las instancias de react-native en node_modules con `module.exports = null`. También
parchear los `*NativeComponent.js` en `src/private/components/virtualview/`.

```bash
for rn_dir in node_modules/.pnpm/react-native@*/node_modules/react-native; do
  for f in "$rn_dir/src/private/specs_DEPRECATED/components/"*.js; do
    printf "'use strict';\nmodule.exports = null;\n" > "$f"
  done
  for f in "$rn_dir/src/private/components/virtualview/"*NativeComponent.js; do
    printf "'use strict';\nmodule.exports = null;\n" > "$f"
  done
done
```

El script reutilizable está en `scripts/src/patch-rn-specs-deprecated.sh`.

## Por qué hay múltiples instancias de RN

pnpm instala una instancia de RN por combinación de peers:
- `react-native@0.81.5_@types+react@19.1.8_...` — la del app
- `react-native@0.81.5_@babel+core@7.29.0_...` — la de react-native-audio-api (u otro paquete con babel como peer)
- `react-native@0.86.0_@types+react@19.2.14_...` — instalada por alguna dep que pide 0.86.0

Hay que parchear TODAS, no solo la primera que se encuentre.

**Why:** Los patches en node_modules se pierden al reinstalar con pnpm. Hay que correrlos
después de cada `pnpm install`. Agregar al post-merge setup script.

**How to apply:** Después de `pnpm install`, correr el script. El metro.config.js tiene
un resolver de respaldo que también redirige archivos de `src/private/specs_DEPRECATED/`
a null-stub.js (segunda línea de defensa).

## Metro transform cache

Si después de parchear el bundle sigue crashando, buscar `StubComponent` en el caché:
```bash
find /tmp/metro-cache -type f | xargs grep -rl "StubComponent" 2>/dev/null
```
Si hay hits → borrar `/tmp/metro-cache` + `/tmp/metro-file-map-*` y reiniciar Expo.

## Diagnóstico para identificar el módulo culpable

Los archivos del transform cache tienen el formato `[content-hash][transform-hash]`.
Usar `strings archivo_del_caché` para ver el código transformado y encontrar el path.
