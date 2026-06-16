---
name: Mixer "tiempo" phase offset semantics
description: BPM-loop phase offset = LAG by beats, audible only with layers; the four buttons map to beats not loop-quarters
---

# Mixer "tiempo" (phase offset) — lag, beats, needs layers

The mixer's per-sound beat buttons (category `"bpm"`, in `MixerSheet`) set a
`phaseOffset` (fraction 0–1 of the loop) applied in `bpmAudioEngine.play()` and
the three Expo paths in `MixerContext` (immediate set, scheduler bar-edge,
resume).

**Decisions baked in (keep consistent if you touch this):**
- **Beats, not loop-quarters.** All BPM sounds are `loopBars: 2` (8 beats). The 4
  buttons map to `[0, 0.125, 0.25, 0.375]` = 0/1/2/3 beats, labeled "tiempo"
  (beat of the bar), NOT "compás". The old `[0, .25, .5, .75]` = 0/2/4/6 beats was
  too coarse and inaudible on symmetric drum loops.
- **LAG, not lead.** "Entrar en el tiempo N" DELAYS this layer's downbeat by the
  offset relative to the shared transport: local buffer pos =
  `(currentPhase - offsetSec + loopSec) % loopSec`. At a bar edge (master phase 0)
  the scheduler seeks `(loopSec - offsetSec) % loopSec`. Offset 0 reduces to the
  prior in-phase behavior everywhere (no-op) — preserves gapless-loop sync.

**Why:** the user reported "no cambia el tiempo del compás". There was NO code
bug — offset was applied correctly. The problem was audibility: quarter-loop
shifts on periodic drum loops are imperceptible, and a single layer has no
reference, so phase shifts are inaudible except as a one-time jump on tap.

**How to apply:** phase offset is meaningful mainly when layering ≥2 BPM sounds
(it shifts one against another). `phaseOffset` is runtime-only — NOT persisted in
presets — so no migration needed when the value set changes. If you change the
button values, update the lag formula in all 4 paths in lockstep or layers desync.

## Declick when repositioning a looping source

You CANNOT reposition a playing Web Audio / react-native-audio-api source — to
change a loop's phase you must create a NEW source and `source.start(now, offset)`
it. A hard cut of the old voice + a new start mid-waveform CLICKS, and the click
differs per offset (each lands at a different point in the wave) — the user heard
this as "se distorciona, no suena igual en todas". Fix: a short (~20 ms) **linear**
crossfade between old and new voice (`bpmAudioEngine.play()` crossfades when a
voice for the same id already exists; `fadeOutAndStop` handles the old half).

**Why linear, not equal-power:** old and new are the SAME loop (just phase-shifted),
so a linear crossfade's summed amplitude never overshoots the target → no clipping.
Equal-power would bump ~+3 dB on correlated signals. A single isolated loop sounds
identical at any phase in steady state, so the click WAS the only artifact.

**Note (not a bug):** sparse/periodic loops (4-on-the-floor kick, steady hi-hat)
are unchanged by a 1–3 beat shift because their own period divides the offset; the
offset is only audible on patterns with a longer period (snare/tambor) or against
other layers. Don't "fix" this — it's inherent to the loop content.
