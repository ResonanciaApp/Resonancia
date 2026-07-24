---
name: RN src/private/specs_DEPRECATED patch for StubComponent crash + LinearGradient workaround
description: Cómo resolver crashes de iOS dev client causados por react-native-audio-api (RN version mismatch + ViewManager registration issues).
---

## Problema raíz — StubComponent

El dev client tiene RN@0.86.0 nativo. El JS bundle usa RN@0.81.5. Los archivos en
`src/private/specs_DEPRECATED/components/` de AMBAS versiones de RN contienen
`requireNativeComponent('StubComponent')` — el babel-plugin-codegen@0.81.5 no puede
parsear sus tipos Flow y los precompila con ese fallback. En runtime, múltiples módulos
intentan registrar el mismo nombre de vista → "Tried to register two views with the same
name StubComponent".

## Fix 1 — StubComponent (RESUELTO)

### Stub correcto: función, NOT null
El stub debe ser una FUNCIÓN (no null). `SafeAreaView_INTERNAL_DO_NOT_USE.js` hace
`require(...).default` — `null.default` tira TypeError en Hermes ("Cannot convert null
value to object"). La función tiene `.default` self-referenciado.

`artifacts/mobile/mocks/null-stub.js`:
```js
function NativeComponentStub() { return null; }
NativeComponentStub.default = NativeComponentStub;
module.exports = NativeComponentStub;
```

### Resolver de Metro — SOLO interceptar components/, NO modules/
`artifacts/mobile/metro.config.js` redirige `specs_DEPRECATED/components/` y
`components/virtualview/` al stub. **NUNCA** interceptar `specs_DEPRECATED/modules/`
(son TurboModules reales: NativeSettingsManager, NativeDevSettings, etc. con getConstants()).

### Parche en disco (node_modules)
Para TODAS las instancias de RN en pnpm — parchear con el contenido del stub:
```bash
for rn_dir in node_modules/.pnpm/react-native@*/node_modules/react-native; do
  for f in "$rn_dir/src/private/specs_DEPRECATED/components/"*.js; do
    printf "'use strict';\nfunction NativeComponentStub(){return null;}\nNativeComponentStub.default=NativeComponentStub;\nmodule.exports=NativeComponentStub;\n" > "$f"
  done
  for f in "$rn_dir/src/private/components/virtualview/"*NativeComponent.js; do
    printf "'use strict';\nfunction NativeComponentStub(){return null;}\nNativeComponentStub.default=NativeComponentStub;\nmodule.exports=NativeComponentStub;\n" > "$f"
  done
done
```
Script reutilizable en `scripts/src/patch-rn-specs-deprecated.sh`.

### Por qué hay múltiples instancias de RN
pnpm instala una instancia de RN por combinación de peers:
- `react-native@0.81.5_@babel+core@7.29.0_...` — la del app + react-native-audio-api
- `react-native@0.86.0_...` — instalada por react-native-audio-api como peer

**Why:** Parchear TODAS las instancias. Los patches se pierden al reinstalar — correr el
script después de cada `pnpm install`.

## Fix 2 — LinearGradient ViewManager (WORKAROUND TEMPORAL)

### Problema
`expo-linear-gradient` usa `requireNativeViewManager('ExpoLinearGradient')` → devuelve
componente con nombre `ViewManagerAdapter_ExpoLinearGradient_<hash>`. El dev client no
tiene ese hash en su ViewConfigRegistry → "View config getter callback must be a function
(received undefined)". **Pre-existente** (expo-modules-core@3.0.30 era igual antes de
agregar react-native-audio-api). Solo se volvió visible al resolver el crash de StubComponent.

**Fix definitivo**: rebuild del dev client con EAS.

### Workaround JS en metro.config.js
Redirige `expo-linear-gradient/build/NativeLinearGradient.ios.js` →
`artifacts/mobile/mocks/native-linear-gradient-stub.js`.

El stub usa el primer color del array como `backgroundColor` sólido.
**Remover** la entrada de `NATIVE_LG_STUB` en metro.config.js después del rebuild.

## Limpieza de caché necesaria después de cada cambio
```bash
chmod -R 777 /tmp/metro-cache 2>/dev/null
rm -rf /tmp/metro-cache /tmp/metro-file-map-*
# luego RA
```

## Metro transform cache — diagnóstico
```bash
find /tmp/metro-cache -type f | xargs grep -rl "StubComponent" 2>/dev/null
```
Si hay hits → borrar caché + reiniciar Expo.
