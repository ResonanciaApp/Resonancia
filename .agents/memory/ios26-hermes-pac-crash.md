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

## Fix — TWO independent flags, BOTH required
1. `["expo-build-properties", { "ios": { "buildReactNativeFromSource": true } }]` in app.json — rebuilds **React Native core** from source (prebuilt React.framework / ReactNativeDependencies.framework disappear, merged into the app binary).
2. EAS env `RCT_BUILD_HERMES_FROM_SOURCE: "1"` (in eas.json build profile `env`) — rebuilds **Hermes itself** from source.

**CRITICAL gotcha:** `buildReactNativeFromSource: true` does **NOT** rebuild Hermes. Hermes is a separate dependency (`hermes-engine` pod) fetched as a prebuilt tarball unless `RCT_BUILD_HERMES_FROM_SOURCE=1` is set. We learned this the hard way: after enabling only `buildReactNativeFromSource`, the crash persisted and the `hermes.framework` UUID in the new `.ips` was **byte-identical** to the previous build (`80d5528f-...`) — proof Hermes was untouched. The PAC crash lives in Hermes, so you MUST set the env var too.

EAS Build defaults to Xcode 26.2, which is what makes the from-source binaries PAC-correct. Tradeoff: long builds (Hermes is large C++ — can add 20-40 min on top of RN-from-source).

**Why:** the npm prebuilt Hermes binary can't be patched from JS/config; only recompiling against the current Xcode SDK produces a PAC-valid binary.

**How to verify which binary is prebuilt:** compare `hermes.framework` (and React.framework) UUIDs in `usedImages` across builds. Same UUID = still prebuilt (flag didn't take). Different UUID / framework absent = rebuilt from source.

**Diagnostic tell:** fault address that decodes to ASCII (e.g. `0x0a31323a3538303e` → "\n12:580>") = a JS value/string being read as a pointer inside Hermes VM = Hermes corruption, not app code.

## Pitfalls
- Do NOT waste builds on JS-side try/catch, disabling Hermes (Podfile still installs it), or JSC (ecosystem needs Hermes).
- `buildReactNativeFromSource: true` + `useFrameworks: "static"` breaks header resolution (needs a Podfile symlink post_install). This project does NOT use static frameworks, so it's fine.
