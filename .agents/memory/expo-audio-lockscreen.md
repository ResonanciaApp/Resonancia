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

## Single-player + shared status listener pitfall (the big one)
A persistent player reused via `.replace()` shares ONE status listener, so events from the *previous* track can be misattributed to the *new* session during a switch. **Why:** during the async setup (`await setAudioModeAsync` before `.replace()`) the old source keeps playing and emitting position events that the handler writes to the new session's id.
**How to apply:** on every session switch — (1) pause the old main player synchronously *before* the await, (2) set a `switchingRef` true synchronously and gate `setIsPlaying` + progress saves on it, (3) skip the first post-switch status tick and the pre-seek tick so the old/pre-seek position is never persisted, (4) clear the guard once the new source's seek/first tick settles. Also reset `voiceActiveRef`/`ambientActiveRef` on `didJustFinish` or stale layers can auto-resume from lock-screen controls.

## Cross-engine coexistence (expo-audio + expo-av) — CAUSED A REAL BUG
AmbientPlayerContext and useVozInterior still run on **expo-av**. There is ONE native AVAudioSession shared by both engines. AmbientPlayerContext **preloads an ambient sound at mount**, so its session config is live for the whole app. It originally set `staysActiveInBackground: false`, which **cut off background/lock-screen playback** of the expo-audio main session the moment the screen locked — confirmed on device.
**Why "PlayerContext asserts last" is NOT enough:** even though PlayerContext re-asserts `shouldPlayInBackground: true` before every play, the always-loaded expo-av ambient sound keeps the session's background flag effective; on lock the OS honors the deactivating config and tears down the whole session.
**How to apply:** any expo-av `setAudioModeAsync` in this app that runs while a sound is loaded MUST use `staysActiveInBackground: true` (AmbientPlayerContext does now). Recording toggles (chat, useVozInterior) only flip `allowsRecording` and restore it, so they're fine. If you add a new expo-av audio surface, keep `staysActiveInBackground: true`.
