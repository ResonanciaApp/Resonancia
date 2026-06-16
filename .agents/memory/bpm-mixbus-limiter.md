---
name: BPM mix-bus soft-clip limiter
description: Why stacking mixer drum loops distorts, how the master-bus limiter fixes it, and react-native-audio-api node gotchas
---

# Mix-bus clipping when stacking BPM loops

All BPM loops in the mixer sum into ONE `masterGain → ctx.destination` in
`artifacts/mobile/lib/bpmAudioEngine.ts`. With 1–2 loops the sum stays under
0 dBFS; at 3+ the summed peaks exceed 1.0 and the AudioContext destination
HARD-CLIPS → harsh digital distortion. Symptom the user reports: "con 2 sonidos
suena bien, al agregar el 3.º (kick) se distorsiona" — distortion scales with the
NUMBER of simultaneous loops, not with any one sound.

**Fix:** a WaveShaper **soft-clip limiter** on the master bus
(`masterGain → waveShaper → destination`). Static transfer curve: identity for
|x| ≤ KNEE (0.8), then `knee + (1-knee)*tanh((|x|-knee)/(1-knee))` above (ceiling
≈ 0.95), symmetric, C¹-continuous (no fold-back). Peaks saturate gently instead
of clipping. Linear-below-0.8 keeps the 1–2 loop case effectively transparent.

**Why a WaveShaper and not a compressor:** `react-native-audio-api` exposes NO
`createDynamicsCompressor`. Confirmed factories: gain, biquadFilter, waveShaper,
delay, iirFilter, stereoPanner, convolver, oscillator, constantSource,
bufferSource, analyser, periodicWave, bufferQueueSource. No compressor/limiter
node — WaveShaper is the only built-in way to limit.

## Gotchas

- **`ctx.createWaveShaper()` takes ZERO args** on the concrete class, even though
  the `IBaseAudioContext` interface types it as taking `WaveShaperOptions`. Passing
  `{curve, oversample}` → TS2554 "Expected 0 arguments, but got 1". Set `curve` and
  `oversample` as PROPERTIES on the returned node instead.
- **WaveShaper clamps input outside [-1,1] to the curve endpoints.** You CANNOT
  represent a wider input domain (e.g. [-4,4]) in the curve to soft-clip big sums —
  inputs >1 just map to the last curve sample. That's actually fine here: the
  endpoint = the ceiling, so sums >1 land at ~0.95 (bounded) instead of clipping at
  destination. But it means a WaveShaper alone can't "soft-clip with makeup" a
  pre-attenuated bus without a real pre-gain node.
- If heavy overload still saturates audibly, the next tuning step is conservative
  count-/power-based headroom (lower masterGain as voices grow) BEFORE the limiter —
  not a bigger curve.
- Build is wrapped in try/catch with fallback to `masterGain → destination`
  (limiter=null) for builds/platforms where WaveShaper is missing.
