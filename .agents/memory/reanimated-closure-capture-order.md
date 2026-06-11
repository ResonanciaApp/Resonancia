---
name: Reanimated closure capture order
description: Variables used inside useAnimatedStyle worklets must be declared BEFORE the hook call, or Reanimated captures undefined.
---

## Rule

Every variable referenced inside a `useAnimatedStyle` (or `useDerivedValue`) worklet **must be declared in the component function body at a line that comes before the `useAnimatedStyle` call**.

## Why

Reanimated 3's Babel plugin serializes worklets at compile time and copies the captured closure values at **call time** (when the hook runs during render). If a variable is declared with `const`/`let` *after* the hook call, it is in the temporal dead zone at the moment Reanimated reads it → the worklet captures `undefined` instead of the real value.

Example bug: `ghostAStyle1` used `effectiveSize` which was declared ~20 lines later. Reanimated captured `undefined` → `off = NaN` → `translateX/translateY` became `NaN` → no displacement → ghost copies appeared exactly on top of the main glyph (invisible effect).

## How to apply

- In `GeometryLayer` and any other animated component, keep a clear "declare first, animate second" ordering:
  1. All derived scalar values (`effectiveSize`, `sw`, `safeX`, etc.)
  2. All `useAnimatedStyle` / `useDerivedValue` hooks
- If you add a new worklet that needs a value computed later in the function, move that computation up before the hook.
- A stale/undefined worklet capture **doesn't throw** — it silently produces `NaN` or `0`, so the bug is invisible unless you know to look for it.
