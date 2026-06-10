---
name: Reanimated slider-driven oscillator
description: Loop start/stop must key off a boolean on/off, not the analog amplitude, or every slider tick collapses the swing.
---

# Reanimated oscillator driven by a slider

When a Reanimated looping animation's amplitude comes from a slider value:

- Keep the AMPLITUDE inside the worklet (read the captured JS value, e.g.
  `safeOnda`, in `useAnimatedStyle`). The worklet rebuilds when that JS value
  changes, so amplitude updates live without touching the loop.
- The `useEffect` that starts/stops the loop must depend on a BOOLEAN on/off
  (`value > 0`), NOT the analog amplitude.

**Why:** if the effect depends on the analog value, every slider tick re-runs
the effect → `cancelAnimation` + restart from the current phase. The loop never
completes a full swing, so the deformation visually collapses / stutters while
dragging.

**How to apply:**
```
const on = amount > 0;
useEffect(() => {
  if (on && motion) {
    sv.value = withSequence(
      withTiming(0, { duration }),
      withRepeat(withTiming(1, { duration }), -1, true),
    );
  } else {
    cancelAnimation(sv);
    sv.value = withTiming(neutral); // 0.5 = sin deformación
  }
}, [on, motion, sv]);
```
Use `withSequence(ease-to-0, repeat 0↔1)` so a neutral-0.5 oscillator sweeps the
full 0↔1 range (phase −1..+1, true contraphase), not just 0.5↔1.
