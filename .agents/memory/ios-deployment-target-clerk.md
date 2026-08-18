---
name: iOS deployment target 17.0 — Clerk requirement
description: Por qué el deployment target es 17.0 y qué rompe si se baja.
---

## Regla
El deployment target de iOS debe ser **17.0** (no 15.1).

**Why:** `@clerk/expo` ≥ 3.7.x incluye `ClerkExpo.podspec` con `s.platforms = { :ios => '17.0' }`. Si el deployment target es menor, CocoaPods saltea el pod ClerkExpo durante la instalación. Sin él:
1. El target "ClerkExpo" no existe en el Pods project.
2. La integración SPM de ClerkKit/ClerkKitUI (registrada por ese pod) falla con `undefined method 'package_product_dependencies' for nil:NilClass` en `spm.rb`.
3. El build de Xcode falla con `no such module 'ClerkExpo'`.

**How to apply:**
- `ios/Podfile.properties.json` → `"ios.deploymentTarget": "17.0"`
- `ios/Resonancia.xcodeproj/project.pbxproj` → `IPHONEOS_DEPLOYMENT_TARGET = 17.0` (4 entradas)
- `app.json` → `expo-build-properties` → `ios.deploymentTarget: "17.0"`
- NO bajar el target sin revisar primero la versión mínima de ClerkExpo.podspec.
