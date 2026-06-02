---
name: Mixer loop + lock-screen status mirror
description: How the mixer makes ambient loops seamless (two-layer equal-power crossfade) and why the lock-screen status mirror must distinguish "loading" from a real pause
---

# Mixer loop + lock-screen (MixerContext)

## Seamless loop = two-layer equal-power crossfade, NOT a single-player dip
A single native loop always has an audible seam at the boundary, and a single-player
volume dip at the edges is clearly audible ("se nota el bajón muchísimo" — user
rejected it). The working approach is TWO layers (`a`, `b`) of the same file, both in
permanent native loop, phase-offset by `dur/2`. Each layer's volume = `base * |sin(pi *
pos/dur)|` from its own position. Because they are half a period apart,
`gainA² + gainB² = sin² + cos² = 1` → constant-power crossfade: when one layer hits its
boundary (gain 0) the other is at its peak, so the perceived level never dips and the
seam is masked.

- `updateInterval: 120ms` so the gain curve moves smoothly.
- Both layers NEVER stop (native loop) → `status.playing` stays true → no end-of-file
  blip to fight (this is why the old "ignore didJustFinish / debounce playing:false"
  guards are no longer the main mechanism).

### Layer B's dur/2 offset must RETRY until confirmed — NOT a single seekTo
A single `seekTo(dur/2)` on B right after `replace()` is unreliable on iOS (same
loaded-but-not-ready problem as play-after-replace): it silently no-ops and the two
layers stay IN PHASE. Symptoms reported on a real device: (1) both layers ramp up from
gain 0 at start → several seconds of silence before the sound is audible; (2) at the
loop boundary both fade to 0 together → audible cut with no crossfade. Fix: in B's
listener, every tick compute `desired = (aPos + dur/2) mod dur` from A's live
`currentTime`, and `seekTo(desired)` repeatedly until `|posB - desired|` is within
tolerance (~0.15s) → then set `offsetConfirmed`. Keep B MUTED (target volume 0) while
unconfirmed so the retry seeks are inaudible. Aligning B relative to A's live position
(not a fixed absolute dur/2) also means the same code path handles the long-session
drift correction (gated on B's low-gain valley).

**Why:** equal-power crossfade is the only way to make a looped ambient bed truly
imperceptible. **How to apply:** any looping mixer sound uses the two-layer crossfade in
`createPlayerFor`; the Map value is a PAIR `{a, b}` and subs are an ARRAY `[subA, subB]`,
so every teardown site (destroyPlayer, stopAll, loadPreset, unmount) must iterate both.

## Phase-lock B against A or it drifts over long sessions
Two independent native loop players wrap at slightly different instants; over hours the
180° offset erodes and the constant-power condition breaks → volume wobble reappears.
Fix: in B's listener, periodically recenter B toward `(aPos + dur/2) mod dur`, but ONLY
when B's gain is in its valley (`gain < 0.12`, i.e. B is near-silent at its own
boundary) so the corrective `seekTo` is inaudible, throttled to once per ~2s and only if
circular error > ~60ms.

**Why:** without re-sync the masking degrades silently after a long time.
**How to apply:** keep the resync gated on the low-gain valley — a seek at audible gain
would click.

## setVolume must NOT write player.volume directly
The crossfade gain owns each layer's `volume` every tick. `setVolume` only updates
`baseVolumesRef` (+ the activeSounds state for the slider); the listener applies it on
the next tick (~120ms). Writing `player.volume = volume` directly would overwrite the
fade gain and cause a level jump at the seam.

## Lock-screen owner: distinguish "loading" from a real pause
The first sound's layer `a` is the lock-screen Now Playing anchor. The status mirror
(owner's `playing` → whole mix) must NOT treat the initial `playing:false` (item still
loading, before it has ever sounded) as a user pause — that caused the "se escucha 2s y
se pausa" bug. Track `lockOwnerHasPlayedRef`: reset to false when the owner changes, set
true once the owner reports `playing:true`; ignore `playing:false` until it has played,
and always cancel the pending pause timer on `playing:true`. Also pre-warm the audio
session once on mount (`ensureAudioMode`).

## Loop flag set order (still applies to each layer)
Native loop is configured at item-load time. The proven pattern (same as PlayerContext
loop sessions, tested on device): `createAudioPlayer(null, {updateInterval})` →
`player.loop = true` → `player.replace(file)`. On web, `replace()` rebuilds the `<audio>`
element with `loop=false`, so re-assert `player.loop = true` each status tick (web only).

Guards/ordering: gate every listener with identity check against the registered pair
(`cur.a !== p && cur.b !== p` → stale player, bail), register the pair in `playersRef`
BEFORE `play()`, and remove all subs wherever a player is torn down.

## Lock-screen scrubber/duration can't be hidden via expo-audio public API
`AudioLockScreenOptions` only exposes `showSeekForward`/`showSeekBackward` — there is NO
`isLiveStream`/hide-duration option. iOS shows the scrubber because the item reports a
finite duration; hiding it (`MPNowPlayingInfoPropertyIsLiveStream`) needs a native patch.

## Background sleep timer
JS timers freeze under a locked screen, so the sleep timer expiry is checked inside the
owner's `playbackStatusUpdate` (which keeps firing in background via
`UIBackgroundModes: ["audio"]`) against `Date.now()` + `sleepEndTimeRef`. The
`setInterval` only drives the visible countdown in foreground.
