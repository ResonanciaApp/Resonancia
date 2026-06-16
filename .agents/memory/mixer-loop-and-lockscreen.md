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

### Do NOT use a "layer A at full volume" warmup to cut start latency (REVERTED, was unstable)
Tempting idea: play layer A at FULL volume the instant it loads (one decode) and only
engage the equal-power crossfade once B is aligned + A crosses `dur/2`. This was tried
and REVERTED — it caused intermittent "the loop cuts and restarts" on a real device
(reported on "viento", fine on "bosque", fine on re-open). **Why it fails:** on device
the first `replace()` decode of a mixer asset can take several seconds (and varies per
file), so B is not always aligned before A reaches its own loop end (`dur`). While still
in warmup, A is at FULL volume at its wrap → the native loop seam is audible (cut +
restart). Re-opening "works" only because the asset is now cached and B aligns in time —
i.e. it's a race, not a fix.
**Rule:** keep the crossfade SYMMETRIC — BOTH layers always use `gain=|sin(pi*pos/dur)|`,
so each layer's own wrap always happens at gain 0 (inaudible) regardless of the other
layer's load state. The cost (first sound ramps from 0) is acceptable; B, once aligned
~dur/2 ahead, comes in near full almost immediately.

### Idle-player cache: park (pause+mute) toggled-off sounds, don't destroy
To make re-activating a sound instant (no mp3 decode wait), toggling a sound OFF
"parks" its layer pair instead of destroying it: pause + set volume 0, move the pair
from `playersRef` into `idlePlayersRef`, and KEEP its crossfade listeners attached.
The listener guard (`playersRef.current.get(id)` identity check) makes parked players
inert — they're not in `playersRef` so ticks early-return; while paused no ticks fire
anyway. Toggling ON resumes from the idle cache (move back to `playersRef`, `play()`
both) — `offsetConfirmed` is still true in the closure, so the crossfade resumes
already-aligned with no re-confirm and no seam. Cache is LRU-capped (`IDLE_CACHE_MAX`);
overflow is hard-destroyed. **Why:** the only real fix for start latency that doesn't
risk the loop seam (a full-volume warmup does — see above). **How to apply:** any new
teardown path (stopAll, loadPreset, unmount, eviction) MUST also drain `idlePlayersRef`,
or parked players leak (their subs live in the shared `loopSubsRef`, so subs get cleared
but the players themselves would survive). `destroyPlayer` looks in BOTH maps.

### Start latency is dominated by asset LOAD time, mostly a dev/Metro artifact
First-tap delay (observed 3-7s, varies per sound) is NOT the gain logic — it's the time
for `createAudioPlayer().replace(require(mp3))` to become ready. Mixer files are tiny
(~320-360KB), so in a real (EAS) build where assets are bundled this is near-instant; in
Expo dev the require'd mp3 streams from the Metro dev server on first access (slow,
variable) and is fast on re-tap once cached. Do not contort the crossfade to chase this;
if real-build latency is still bad, the safe lever is caching toggled-off players
(pause+mute instead of destroy) so re-taps are instant — not a full-volume warmup.

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
when B's gain is in its DEEP valley (`gain < 0.06`) so the corrective `seekTo` is
inaudible, throttled to once per ~2s and only if circular error > ~60ms. The valley alone
is not enough: a `seekTo` is a waveform discontinuity that clicks even at low gain, so
ALSO force B's volume to 0 across the jump via a short time-bounded mute window
(`recenterMuteUntil`, ~`min(260, dur*35)` ms — scaled down for short loops so it stays
inside the valley) and let the next tick restore the (still-low) gain.

**Why:** without re-sync the masking degrades silently after a long time; a bare seek even
in the valley still ticks.
**How to apply:** keep the resync gated on the DEEP valley AND muted across the seek — gain
gate alone is insufficient.

## First-play "TAC" = the B-seed seekTo happening while audio is already audible
Symptom: a single click/"tac" near ~1s on the FIRST play of a sound, GONE after
deselect+reselect. Root cause: the B-seed `seekTo(aPos+dur/2)` (the retry-until-confirmed
alignment above) lands a position jump WHILE the layers have already started ramping
audible → audible discontinuity. Resume has no seed seek (`offsetConfirmed` already true
in the closure) → no click, which is exactly why it only happened the first time.
Fix/invariant: do NOT start the global fade-in (`audibleStart`) as soon as audio is
audible — keep BOTH layers silent until B's seed CONFIRMS (`offsetConfirmed`), set
`audibleStart` inside the seed-confirm block, with a fallback timer (~1.5s) so it can't
stay muted forever if the seed never confirms. So first play becomes "silent seed → ramp",
identical to a resume.
**Resume gotcha (regression risk):** `resetFade()` zeroes `audibleStart`, but on a fast
re-tap the seed-confirm block does NOT run again (already confirmed), and the seed
fallback is anchored to the ORIGINAL load time → it fires immediately, but ONLY if you
also short-circuit at the top of the listener: `if (offsetConfirmed && audibleStart===0)
audibleStart = now`. Without that, a resume within the fallback window starts both layers
at volume 0 and stays SILENT for up to the fallback (~1.5s) — breaks instant re-tap.
**Why:** the equal-power masking only hides the loop SEAM; a mid-stream seek is a separate
discontinuity that must happen in silence. **How to apply:** never re-enable
"audibleStart on first audio tick"; any new resume/seed path must enable the fade
immediately once `offsetConfirmed`, never wait on the fallback.

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
