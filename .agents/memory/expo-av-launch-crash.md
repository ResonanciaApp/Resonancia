---
name: iOS launch SIGABRT on SDK 54 New Arch (expo-updates error recovery; audio was a red herring)
description: A standalone iOS launch crash that LOOKED like audio but was actually expo-updates error recovery; how to read the .ips queue name to find the real culprit
---

# RESOLUTION (read first): the real cause was expo-updates, not audio

The crash (`EXC_CRASH / SIGABRT`, `objc_exception_throw`, ~1s after launch) was
**expo-updates**, not audio. The decisive clue was ONLY in the FULL `.ips` file:
`"legacyInfo": { "threadTriggered": { "queue": "expo.controller.errorRecoveryQueue" } }`
— that GCD queue belongs to `EXUpdatesAppController`'s error-recovery path. The
`lastExceptionBacktrace` frames were all `imageIndex:0` = the main `RESONANCE`
binary (Expo modules are statically linked), so offsets alone could not name the
module — the **queue name** did.

**Why the audio fixes did nothing:** the backtrace was byte-identical across every
build because expo-updates error recovery sits independent of the audio code. The
app.json had `updates.url` but no `enabled` flag → expo-updates ran at launch,
something in its update/recovery path threw an uncatchable NSException → abort.

**Fix that worked:** in `app.json`, `updates.enabled: false` (kept the `url` for
later). Test/preview builds load the embedded JS bundle and don't need OTA, so
disabling updates removes the error-recovery machinery and the crash. Re-enable
when actually shipping OTA updates.

**Lesson for next time:** for any standalone iOS launch SIGABRT, get the FULL `.ips`
and read `legacyInfo.threadTriggered.queue` (and faulting-thread queue names)
FIRST. The queue name identifies the owning module even when every frame is
`imageIndex:0`. Do not guess from screenshots that omit `legacyInfo`/`usedImages`.

---

(Below: the earlier audio investigation. The audio deferral changes were kept as
good practice — configuring AVAudioSession off the launch path is still correct —
but they were NOT the cause of this crash.)


# expo-av audio session at launch = uncatchable SIGABRT (SDK 54 + New Arch)

On Expo SDK 54 with `newArchEnabled: true`, calling an audio TurboModule void method
(e.g. `Audio.setAudioModeAsync` from **expo-av**, or loading a sound) **at app launch**
can throw a native `NSException` on a GCD/serial dispatch queue. The New Architecture
does NOT swallow it, so it propagates → `abort()` → `EXC_CRASH / SIGABRT`
("Abort trap: 6", `objc_exception_throw` in the stack). The app opens ~1s then closes.

A JS `.catch()` on the promise does **not** prevent it — the throw is synchronous in
the native void method, before the promise resolves.

**Trigger here:** ANY `setAudioModeAsync` on the launch path throws — even a SINGLE lib.
First removed expo-av's launch call → crash persisted with byte-identical backtrace
(same imageIndex-0 offsets). The survivor was **expo-audio**'s `setAudioModeAsync` in a
provider mount `useEffect`. Configuring AVAudioSession during the ~1s launch window
(app not yet fully foregrounded/active) throws regardless of which lib does it. Only
reproduces in standalone release builds (Expo Go masks it).

**Key debugging signal:** the `lastExceptionBacktrace` showed `_dispatch_workloop_worker_thread`
→ `_dispatch_lane_serial_drain` → `_dispatch_call_block_and_release` (the RN TurboModule
serial queue) + `objc_exception_throw` — i.e. a TurboModule **void** method throwing.
`setAudioModeAsync` is exactly such a void method. An identical backtrace across two
different builds means the throwing native fn is unchanged → look for the audio call you
did NOT remove, not the one you did.

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
