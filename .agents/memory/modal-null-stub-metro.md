---
name: RN Modal roto por null-stub de specs_DEPRECATED
description: Por qué todos los <Modal> pueden dejar de mostrarse en silencio en este proyecto (metro.config + parche in-place)
---

**Síntoma:** tap funciona, el estado `visible` pasa a `true` (confirmado con logs), pero NINGÚN `<Modal>` de react-native aparece. Sin error, sin redbox.

**Causa:** el fix de compatibilidad del dev client stubbea a `null` los archivos de `react-native/src/private/specs_DEPRECATED/components/` en DOS lugares:
1. `artifacts/mobile/metro.config.js` (resolver → NULL_STUB)
2. Parche in-place en node_modules (`module.exports = null` escrito directo al archivo)

`RCTModalHostViewNativeComponent.js` (la vista nativa detrás de `<Modal>`) vive ahí → Modal renderiza en la nada.

**Fix:** excluir `RCTModalHostViewNativeComponent` del regex en metro.config Y restaurar el archivo original en node_modules (bajar el tarball `npm pack react-native@0.81.5` y copiar el archivo).

**Ojo:** el parche in-place se pierde con cada `pnpm install` que recree node_modules — pero también puede REAPARECER si alguien re-aplica el parche masivo. En ese dir también viven ActivityIndicator, Switch, PullToRefresh, SafeAreaView, InputAccessory: si alguno de esos deja de renderizar en silencio, es el mismo problema.

**Actualización (26 jul 2026):** `SwitchNativeComponent.js` + `AndroidSwitchNativeComponent.js` también restaurados (el toggle "intención diaria" renderizaba solo la etiqueta, sin switch). Excluidos en metro.config.js Y en `scripts/src/patch-rn-specs-deprecated.sh` (case SKIP). Restaurar desde `npm pack react-native@0.81.5` si `pnpm install` los pisa.
