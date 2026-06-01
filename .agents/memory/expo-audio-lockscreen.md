---
name: expo-audio lock-screen player
description: Constraints and pitfalls when using expo-audio (SDK 54) persistent players for the meditation player with lock-screen controls
---

# expo-audio lock-screen player (PlayerContext)

The mobile player uses **expo-audio** (not expo-av) with a persistent-player +
`.replace(source)` pattern: one long-lived player each for main / voice / ambient,
reused across sessions instead of creating a new player per play.

## Lock screen
- Native lock-screen / Now Playing controls come from `setActiveForLockScreen(active, metadata, options)` on the **main player only**. Remote play/pause/seek are handled natively — do NOT wire commands manually; just react to the `playbackStatusUpdate` event and mirror play/pause onto the voice/ambient layers.
- Background playback requires BOTH the runtime audio mode (`setAudioModeAsync({ shouldPlayInBackground: true })`) AND native config in app.json: iOS `UIBackgroundModes: ["audio"]`; Android `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `POST_NOTIFICATIONS`.
- **Cannot be verified in the Replit/web environment** — lock screen only exists on a real device build (EAS dev build). Expo Go may or may not expose it.
- **CONFIRMED on device: background audio + lock-screen controls DO NOT work in Expo Go (SDK 54).** Audio cuts off the instant the screen locks. **Why:** iOS `UIBackgroundModes: ["audio"]` and Android FOREGROUND_SERVICE_MEDIA_PLAYBACK must be compiled into the native binary; Expo Go is a fixed prebuilt app and ignores our app.json native config. `shouldPlayInBackground: true` alone is not enough without the entitlement. **How to apply:** the only way to test/ship background audio is an EAS **development build** (or production build) — do NOT keep changing audio code to "fix" cut-off in Expo Go; the code is correct, the runtime is the limitation. The ambient `staysActiveInBackground: true` fix still matters, but only takes effect in a real build.

## "Sin Reproducción" — controls never appear even though bg audio plays (ROOT CAUSE)
The blocker was **NOT** artwork or `setActiveForLockScreen` failing — that call returned OK. The real cause: `setAudioModeAsync` used the **default `interruptionMode: 'mixWithOthers'`**, and iOS will **not** make a mixing app the Now Playing app, so MPNowPlayingInfoCenter never surfaces in Control Center / lock screen.
**Why:** mixing = "play alongside others", which by design forfeits Now Playing ownership.
**How to apply:** set `interruptionMode: 'doNotMix'` (exclusive focus, like Calm/Headspace) in every `setAudioModeAsync` on the main player path. Tradeoff: it pauses other apps' audio (expected for a meditation app). In-app layering (main+voice+ambient, mixer) is unaffected — `mixWithOthers` is about OTHER apps, not your own players in one session.

## NaN duration drops the whole Now Playing entry
expo-audio's native `updateNowPlayingInfo` writes `MPMediaItemPropertyPlaybackDuration = player.duration` unconditionally; right after `.replace()` the AVPlayerItem isn't loaded so `duration` = NaN, and iOS rejects the entire dict.
**How to apply:** don't call `setActiveForLockScreen` synchronously after replace/play. Defer it: stash a pending ref and fire from the status handler on the first tick where `status.isLoaded && status.duration > 0`. Clear that pending ref in teardown/stop and all simulation-fallback branches so a late tick can't re-register stale metadata.

## Artwork URL
Pass the bundled image URL straight through (`Image.resolveAssetSource(session.image).uri`). The dev Metro URL has a second `?` — Swift `URL(string:)` accepts it and it loads fine. A failing artwork download is harmless: Now Playing registers independently of the async artwork fetch. **Prod caveat:** release builds resolve to `file://`, which expo-audio's `URLSession` artwork fetch may not load — if prod artwork is missing, serve session images over http (Object Storage/API).

## Single-player + shared status listener pitfall (the big one)
A persistent player reused via `.replace()` shares ONE status listener, so events from the *previous* track can be misattributed to the *new* session during a switch. **Why:** during the async setup (`await setAudioModeAsync` before `.replace()`) the old source keeps playing and emitting position events that the handler writes to the new session's id.
**How to apply:** on every session switch — (1) pause the old main player synchronously *before* the await, (2) set a `switchingRef` true synchronously and gate `setIsPlaying` + progress saves on it, (3) skip the first post-switch status tick and the pre-seek tick so the old/pre-seek position is never persisted, (4) clear the guard once the new source's seek/first tick settles. Also reset `voiceActiveRef`/`ambientActiveRef` on `didJustFinish` or stale layers can auto-resume from lock-screen controls.

## Cross-engine coexistence (expo-audio + expo-av) — CAUSED A REAL BUG
AmbientPlayerContext and useVozInterior still run on **expo-av**. There is ONE native AVAudioSession shared by both engines. AmbientPlayerContext **preloads an ambient sound at mount**, so its session config is live for the whole app. It originally set `staysActiveInBackground: false`, which **cut off background/lock-screen playback** of the expo-audio main session the moment the screen locked — confirmed on device.
**Why "PlayerContext asserts last" is NOT enough:** even though PlayerContext re-asserts `shouldPlayInBackground: true` before every play, the always-loaded expo-av ambient sound keeps the session's background flag effective; on lock the OS honors the deactivating config and tears down the whole session.
**How to apply:** any expo-av `setAudioModeAsync` in this app that runs while a sound is loaded MUST use `staysActiveInBackground: true` (AmbientPlayerContext does now). Recording toggles (chat, useVozInterior) only flip `allowsRecording` and restore it, so they're fine. If you add a new expo-av audio surface, keep `staysActiveInBackground: true`.
