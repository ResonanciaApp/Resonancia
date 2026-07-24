---
name: RN src/private/specs_DEPRECATED patch for StubComponent crash + LinearGradient workaround + duplicate React dedup
description: Cómo resolver crashes de iOS dev client causados por react-native-audio-api (RN version mismatch + ViewManager registration issues + duplicate React instance).
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

## Fix 2 — "ViewManagerAdapter_<Module>_<hash> must be a function" (RESUELTO de raíz)

### Root cause REAL (no era pre-existente)
react-native-audio-api instaló `expo-modules-core@57.x` (nuevo esquema de versionado
para RN 0.86) además de la `3.0.30` del SDK 54. Los módulos expo (expo-blur,
expo-symbols, expo-linear-gradient, …) importan `expo-modules-core` SIN tenerlo en su
contexto pnpm propio → caen al fallback global `.pnpm/node_modules/expo-modules-core`,
que apunta a la 57.x. Su `requireNativeViewManager()` genera nombres
`ViewManagerAdapter_<Module>_<hash>` con un hash distinto al que registró el dev client
(compilado contra 3.x) → "View config getter callback must be a function (received
undefined)". Afectó en cadena a ExpoLinearGradient, ExpoBlurView y SymbolModule
(mismo sufijo de hash en todos = misma causa).

### Fix — intercept del REQUEST en metro.config.js (no rewrite de paths)
La 3.0.30 distribuye FUENTE (`main: src/index.ts`, build/ solo .d.ts) mientras la 57.x
distribuye `build/*.js` compilado → reescribir paths resueltos NO funciona (el archivo
gemelo no existe). En su lugar, en `resolveRequest`, si `moduleName` es
`expo-modules-core` o subpath, se re-resuelve con `originModulePath` apuntando DENTRO
de la instancia 3.x (detectada dinámicamente escaneando `.pnpm/expo-modules-core@3.*`).
Todo el bundle comparte así la única copia que el dev client conoce.

**Why:** cuando pnpm duplica un paquete cuya versión mala distribuye build y la buena
distribuye fuente, el dedup en Metro debe interceptar el request (cambiar el origin de
resolución), no el filePath resuelto.

### Stubs previos (obsoletos, borrar si molestan)
`mocks/native-linear-gradient-stub.js` y `mocks/expo-blur-stub.js` fueron workarounds
mientras se creía que era un mismatch del dev client. Ya NO están cableados en
metro.config.js. Con el dedup, gradientes/blur/symbols nativos REALES funcionan sin
rebuild EAS.

## Fix 3 — Duplicate React instance / "useMemoCache/useContext of null" (RESUELTO)

### Problema
`react-native-audio-api@0.12.2` peer-depende de `react-native@0.86.0` que a su vez
peer-depende de `react@19.2.8`. pnpm instala AMBAS versiones de React Y crea instancias
GEMELAS de todo paquete que tenga react como peer:
- `@tanstack+react-query@5.100.9_react@19.1.0` ← usa mobile
- `@tanstack+react-query@5.100.9_react@19.2.8` ← usaba `lib/api-client-react` (!!)

El `api.ts` generado (lib/api-client-react) importaba `useQuery` de la variante
_react@19.2.8, cuyo `require('react')` retorna la SEGUNDA copia de React. El renderer
inicializa el dispatcher solo en la copia 19.1.0 → en la otra `ReactSharedInternals.H`
es null → "Cannot read property 'useContext' of null" (o 'useMemoCache' con React
Compiler habilitado — mismo root cause, distinto síntoma).

### Lo que NO funcionó
- `extraNodeModules` — pnpm resuelve por symlinks del contexto de cada paquete; Metro
  solo consulta extraNodeModules cuando la resolución normal falla. Inútil aquí.
- Deshabilitar React Compiler (`experiments.reactCompiler: false` en app.json) — solo
  cambió el síntoma de useMemoCache → useContext (React Query llama useContext). El
  Compiler quedó deshabilitado igualmente; re-habilitar cuando se desee (era optimización).

### Fix que SÍ funciona — rewrite de paths en resolveRequest
En metro.config.js, después de la resolución normal, reescribir cualquier filePath que
contenga `react@19.2.8` a su gemelo `react@19.1.0` (validando existencia con fs.existsSync):
```js
if (fp.includes("react@19.2.8")) {
  const rewritten = fp.replace(/react@19\.2\.8/g, "react@19.1.0");
  if (fs.existsSync(rewritten)) return { filePath: rewritten, type: "sourceFile" };
}
```
Cubre `.pnpm/react@19.2.8/`, `.pnpm/@tanstack+react-query@..._react@19.2.8/`,
`.pnpm/react-dom@..._react@19.2.8/`, etc. Las gemelas son la MISMA versión del paquete
(solo difiere el peer), estructura de archivos idéntica → rewrite seguro.

**Why:** en pnpm el dedup de peers duplicados NO se arregla con extraNodeModules ni
alias de nombres — hay que reescribir los paths RESUELTOS. Diagnóstico rápido:
`readlink <pkg>/node_modules/@tanstack/react-query` para ver qué variante usa cada
workspace package.

**Después de aplicar:** limpiar caché y RA.

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

## Orden de aplicación de los fixes
1. Patch en disco (specs_DEPRECATED/components/) → Fix StubComponent register clash
2. Metro resolver (resolveRequest) → Safety net para specs_DEPRECATED + LG workaround
3. Metro extraNodeModules → Deduplica React para React Compiler useMemoCache
4. Rebuild dev client con EAS → Fix definitivo para LG + cualquier hash mismatch
