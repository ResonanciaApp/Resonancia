---
name: Mixer loop + lock-screen status mirror
description: expo-audio loop flag reliability and why a per-player status listener must not mirror loop boundaries onto a whole mix
---

# Mixer loop + lock-screen status mirror (MixerContext)

## Loop flag must be set on a player that already has its source
Create the player with the source in the constructor (`createAudioPlayer(file)`) and
then set `player.loop = true`. The `createAudioPlayer(null)` + `player.loop = true` +
`player.replace(file)` order can DROP the loop flag — the sound plays once and stops
at the end of the MP3 (no loop), both in foreground and with the screen locked.

**Why:** setting `loop` before the source/item is loaded does not reliably persist
through `replace()` in expo-audio (1.1.x). The constructor path has the item loaded
when `loop` is assigned.

**How to apply:** any short looping sound (mixer ambient loops) must use the
constructor-source path. Long one-shot tracks that legitimately end are fine either way.

## The native loop flag is NOT reliable on web — always add a manual fallback
The constructor-source `loop = true` fix above was still not enough on the **web
preview** (react-native-web): the sound played once and stopped. On web `loop` maps
to a plain `<audio loop>` (`media.loop`), which should loop, but in practice did not
restart. The robust fix is a per-player manual fallback: each player gets its own
`playbackStatusUpdate` listener that, on `status.didJustFinish`, does `seekTo(0)` +
`play()`. Guard it with `playersRef.get(id) === player` so removed/replaced players
don't restart, and register the player in `playersRef` BEFORE calling `play()` (a
very short asset can fire `didJustFinish` before the map assignment, which would skip
the first loop). Track the subscriptions and remove them everywhere a player is torn
down (destroyPlayer, stopAll, loadPreset, unmount).

**Why:** native `loop` is seamless when it works (with real native loop, HTML5 does
NOT emit `ended`/`didJustFinish`, so the fallback never runs and there is no double
restart) but it cannot be trusted across platforms — web was the failing case here.
**How to apply:** treat the native loop flag as best-effort; the `didJustFinish`
self-restart is what actually guarantees continuous looping. Users frequently test in
the web preview, so verify loop there, not only on device.

## A per-player status listener that controls the whole mix must ignore loop boundaries
The mixer designates the first player as the lock-screen "owner" and mirrors its
`playbackStatusUpdate.playing` onto ALL players (so the lock-screen pause button
pauses the whole mix). That mirror must NOT react to:
- our own play/pause calls → guard with a ~1s `ignoreLockUntil` window set inside `applyPlaying`
- loop-cycle boundaries → ignore updates where `status.didJustFinish` is true
- transient `playing:false` blips → debounce ~350ms before propagating a pause

**Why:** without these guards the owner's natural end-of-file / loop-restart fires
`playing:false`, which paused the entire mix permanently (~12s symptom), and our own
play/pause echoed back causing the play button to flicker.

## Background sleep timer
JS `setInterval`/`setTimeout` freeze under a locked screen, so the sleep timer cannot
rely on them to pause. The owner player's `playbackStatusUpdate` keeps firing in
background (native audio engine stays alive via `UIBackgroundModes: ["audio"]`), so
the timer expiry is also checked inside that listener against `Date.now()` and
`sleepEndTimeRef`. The `setInterval` only drives the visible countdown in foreground.
