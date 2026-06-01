---
name: iOS 26 Hermes PAC launch crash
description: EXC_BAD_ACCESS on JS thread on physical iOS 26 devices — prebuilt Hermes vs ARM64 PAC; fix is buildReactNativeFromSource
---

# iOS 26 + Hermes PAC launch crash (physical devices)

## Symptom
- Standalone build crashes at launch ONLY on **physical iOS 26 devices** (simulators fine).
- `.ips`: `EXC_BAD_ACCESS (SIGSEGV)`, `KERN_INVALID_ADDRESS at 0x0` (or `KERN_PROTECTION_FAILURE`, or address `0xfffd...`), `legacyInfo.threadTriggered.name = com.facebook.react.runtime.JavaScript`. Stack (when symbolicated) lands in `hermesvm HiddenClass::findProperty` / `JSObject::getNamedDescriptorUnsafe`.
- Worse / 100% on newest chips (A18 Pro, A19 / iPhone 17 line, modelCode iPhone18,x) — stricter ARM64 Pointer Authentication (PAC).

## Root cause
The **prebuilt Hermes xcframework** shipped via npm was compiled against an older Apple SDK; iOS 26 hardened ARM64 PAC and changed VM layout, so Hermes' raw pointer arithmetic fails PAC validation. Upstream-tracked, NOT app code: facebook/hermes#1966, expo/expo#44356, A18-specific expo/expo#44680. Affects SDK 54 & 55, RN 0.81/0.83, Hermes V1 & V2, Old & New Arch. Release builds only — dev client / interpreted mode works.

## Fix (Expo managed, the one we used)
Recompile RN+Hermes **from source** so it's built against Xcode 26 (PAC-correct):
```json
["expo-build-properties", { "ios": { "buildReactNativeFromSource": true } }]
```
EAS Build defaults to Xcode 26.2, which is what makes the from-source binary PAC-correct. Tradeoff: much longer builds (~30-45 min vs ~20) because RN/Hermes compile from scratch.

**Why:** the npm prebuilt Hermes binary can't be patched from JS/config; only recompiling against the current Xcode SDK produces a PAC-valid binary.

**How to apply:** when a physical iOS 26 device crashes at launch with EXC_BAD_ACCESS on the JS thread and the rest of the JS is fine, add the plugin and rebuild. Do NOT waste builds on JS-side try/catch, disabling Hermes (Podfile still installs it), or JSC (ecosystem needs Hermes).

## Alternatives (lighter but less comprehensive)
- EAS env `RCT_BUILD_HERMES_FROM_SOURCE: "1"` rebuilds only Hermes from source (faster than full RN-from-source). Use if full from-source build is too slow.
- Pitfall: `buildReactNativeFromSource: true` + `useFrameworks: "static"` breaks header resolution (needs a Podfile symlink post_install). This project does NOT use static frameworks, so it's fine.
