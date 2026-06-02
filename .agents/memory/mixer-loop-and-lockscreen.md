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

## A clean (gapless) loop requires the native loop flag — re-assert it, don't rely on didJustFinish
Setting `player.loop = true` once right after `createAudioPlayer(file)` is NOT enough:
the flag does not reliably persist if the source has not finished loading yet, so the
sound plays once and stops. The fix that gives a CLEAN/continuous loop is to
**re-assert `player.loop = true` on every `playbackStatusUpdate`** (idempotent and
cheap): as soon as the item is loaded the native loop flag sticks and the engine loops
seamlessly (web maps it to `<audio loop>`).

Do NOT rely on a `didJustFinish` → `seekTo(0)` + `play()` manual restart as the primary
mechanism: (1) it introduces an audible gap (not a clean loop), and (2) on web it
barely fires at all — expo-audio's web `AudioPlayerWeb._createMediaElement` has
`media.onended = () => { lastEmitTime = 0 }` which does NOT emit a status update, so
the listener almost never sees `didJustFinish: true` on web. Keep the manual restart
only as a last-resort safety net.

Guards/ordering that still matter: gate the listener with `playersRef.get(id) ===
player` (ignore removed/replaced players), and register the player in `playersRef`
BEFORE calling `play()`. Track subscriptions in a ref and remove them everywhere a
player is torn down (destroyPlayer, stopAll, loadPreset, unmount).

**Why:** native loop is the only gapless loop; a JS-driven restart always has a seam
and depends on an `ended`/`didJustFinish` event that web does not emit.
**How to apply:** for any looping ambient/mixer sound, set loop in the constructor
path AND re-assert it in the status listener. Verify in the web preview (users test
there), not only on device.

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
