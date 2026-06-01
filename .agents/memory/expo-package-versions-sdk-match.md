---
name: Expo package versions must match the SDK
description: Use expo install for Expo packages; guessed versions cause "Cannot find native module" only visible on real device builds
---

Rule: In the mobile app, add/upgrade Expo packages with `expo install <pkg>` (or `expo install --fix`), NEVER `pnpm add expo-foo@<guessed-version>`.

**Why:** Guessed versions can resolve to a *future* SDK while the app is on SDK 54 (real incident: expo-application/expo-file-system/expo-notifications/expo-store-review got pinned to 56.x). Metro still bundles the JS and `typecheck` passes, so nothing looks broken — but the native module for that version is not in the SDK-54 native build. On a real device build it throws at runtime: `Cannot find native module 'FileSystem' / 'ExpoApplication' / 'ExpoPushTokenManager'`. This is invisible in web preview and in typecheck; it only surfaces once the app actually runs on a device build.

**How to apply:** If you see "Cannot find native module X" on a dev/preview build (but not in Metro/web), suspect an Expo SDK version mismatch. Fix: `npx expo install --fix` (realigns all Expo/RN packages to the installed SDK) → `pnpm install` → **rebuild the dev client** (native change; a Metro reload is NOT enough) → reinstall on device. Note expo-file-system v19 (SDK 54) already has the new `File`/`Paths` API, legacy lives at `expo-file-system/legacy`.
