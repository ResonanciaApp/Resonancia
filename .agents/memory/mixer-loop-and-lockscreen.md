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

## A clean (gapless) loop: set loop BEFORE replace (native) AND re-assert it (web)
The only gapless loop is the native `loop` flag (no JS restart). But WHEN you set it
matters and differs by platform — this took several wrong attempts:

- **iOS/Android (native):** the flag must be set BEFORE the source loads, or the engine
  configures the item without looping and the sound stops at the end of the MP3. The
  proven pattern (same as PlayerContext's loop sessions, tested on device) is:
  `createAudioPlayer(null)` → `player.loop = true` → `player.replace(file)`.
  `createAudioPlayer(file)` + `loop = true` afterwards does NOT loop on iOS — the item
  already loaded without looping.
- **Web (react-native-web):** `replace()` recreates the underlying `<audio>` element
  with `loop=false` (see `AudioPlayerWeb._createMediaElement`), so any loop set before
  replace is dropped. Setting `media.loop` mid-playback DOES work though, so we
  **re-assert `player.loop = true` on every `playbackStatusUpdate`** (idempotent, cheap;
  web emits status ~every updateInterval/500ms, long before a multi-minute MP3 ends).

So the combined recipe used in `createPlayerFor`: create empty, set loop, replace with
file (native path), then a status listener that re-asserts `loop` each tick (web path).

Do NOT rely on a `didJustFinish` → `seekTo(0)` + `play()` manual restart as the primary
mechanism: it has an audible gap, AND on web it barely fires — `media.onended` in
expo-audio's web build does NOT emit a status update, so `didJustFinish: true` rarely
reaches the listener there. Keep it only as a last-resort net.

Guards/ordering: gate the listener with `playersRef.get(id) === player`, register the
player in `playersRef` BEFORE `play()`, and remove subscriptions everywhere a player is
torn down (destroyPlayer, stopAll, loadPreset, unmount).

**Why:** native loop is gapless but is configured at item-load time on iOS; web rebuilds
the element on replace so it needs a runtime re-assert. **How to apply:** any looping
mixer/ambient sound uses the create(null)→loop→replace pattern PLUS the re-assert
listener. Test BOTH the iOS device (lock screen) and the web preview.

## play() right after replace() is unreliable on iOS — start on the "loaded" status tick
Confirmed on a physical iOS device (via diagnostic logs): when a sound is added to an
already-playing mix, `player.play()` called immediately after `player.replace(file)`
silently no-ops because the AVPlayerItem has not finished loading yet. Symptom: the
sound appears in the UI but stays silent / "feels slow" until another interaction.
Logs showed the new player at `loaded ... playing=false` while the first one was
`playing=true`.

Fix: in the per-player `playbackStatusUpdate` listener, once the item is loaded
(`status.duration > 0`), if the mix should be playing (`isPlayingRef.current`) and this
player is not playing, call `player.play()`. It is idempotent and self-correcting:
during normal playback `status.playing` is already true so it never fires, and after a
user pause `isPlayingRef` is false so it won't fight the pause.

**Why:** iOS drops a play command issued before the item is ready; the keep-the-initial
`play()` call alone is racy. **How to apply:** for any dynamically-added looping player,
gate the real start on the loaded tick, not on the call right after replace().

## Lock-screen scrubber/duration can't be hidden via expo-audio public API
The user wanted the locked-screen Now Playing to show no duration/progress scrubber
(like Calm) for an endless mix. `AudioLockScreenOptions` only exposes
`showSeekForward`/`showSeekBackward` — there is NO `isLiveStream` / hide-duration
option. iOS shows the scrubber because the item reports a finite duration. Hiding it
(`MPNowPlayingInfoPropertyIsLiveStream`) would require patching the native module, so
it is not doable from JS without forking expo-audio.

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
