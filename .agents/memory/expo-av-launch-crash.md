---
name: expo-av launch SIGABRT under New Architecture
description: Why expo-av audio-session calls at app launch crash standalone iOS builds on SDK 54 New Arch, and how to avoid it
---

# expo-av audio session at launch = uncatchable SIGABRT (SDK 54 + New Arch)

On Expo SDK 54 with `newArchEnabled: true`, calling an audio TurboModule void method
(e.g. `Audio.setAudioModeAsync` from **expo-av**, or loading a sound) **at app launch**
can throw a native `NSException` on a GCD/serial dispatch queue. The New Architecture
does NOT swallow it, so it propagates → `abort()` → `EXC_CRASH / SIGABRT`
("Abort trap: 6", `objc_exception_throw` in the stack). The app opens ~1s then closes.

A JS `.catch()` on the promise does **not** prevent it — the throw is synchronous in
the native void method, before the promise resolves.

**Trigger here:** two audio libs (expo-av AND expo-audio) both configured the native
AVAudioSession at launch → session conflict → throw. Only reproduces in standalone
release builds (Expo Go masks it); confirms the classic "works in dev, crashes in build".

**Why:** expo-av is deprecated in SDK 54 (removed in 55) and runs via a fragile interop
shim under New Arch. Cannot just disable New Arch — `react-native-reanimated` v4 REQUIRES it.

**How to apply:**
- Keep expo-av (and any audio-session config) OFF the launch path. Never call
  `setAudioModeAsync` / load sounds in a provider's mount `useEffect` if two libs do it.
- Let the maintained lib (expo-audio) be the SOLE owner of the session at startup.
- Defer expo-av session setup to first actual use (lazy, guarded by a ref + try/catch).
- Long-term: migrate remaining expo-av usages (recording in useVozInterior/chat,
  onboarding sound) to expo-audio; expo-av will be removed in SDK 55.
- Note: device was iOS 26.1; a *separate* SDK 54/55 crash exists (Hermes PAC →
  EXC_BAD_ACCESS) — different signal, not this one.
