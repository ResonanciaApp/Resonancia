---
name: Stale legacy default in AsyncStorage
description: When a hardcoded default is replaced by a dynamic/theme-linked default, old persisted values matching the PREVIOUS hardcoded default must also be excluded on load, not just the new default id.
---

## The problem

A feature (e.g. MixerSheet "Tu mezcla" background) originally had a hardcoded
default value (e.g. `"borgona"`). Later, the default was changed to be
dynamic — linked to another piece of state (e.g. the active Escena theme from
`useSceneTheme()`) — via a new sentinel id (e.g. `"blanco"` / `DEFAULT_BG_PRESET_ID`).

The load-from-storage code only skipped restoring the value when it equaled
the NEW default id:

```ts
if (bg[1] && bg[1] !== "blanco") setBgPresetId(bg[1]);
```

But `"borgona"` is a legitimate, still-selectable preset in the list. Any
user who used the feature before the theme-link existed has `"borgona"`
persisted from that era, and it gets treated as an intentional custom
selection — permanently overriding the new dynamic-default behavior with the
old hardcoded look, even though the user never explicitly chose it after the
change.

## Why

Migrating a hardcoded default to a computed/dynamic one is not just a code
change — it silently orphans any previously-persisted value that equaled the
old default. If that old id is still a valid, addressable option in the
system, there is no way to distinguish "user explicitly picked the old
default's value" from "this was auto-saved before the feature existed."

## How to apply

When replacing a hardcoded default with a dynamic/linked one:
- Identify what the OLD hardcoded default value was (grep other places in the
  codebase that reference the same storage key/state for a hardcoded fallback
  — e.g. `contextBgPresetId ?? "borgona"` elsewhere revealed the old default).
- Exclude that old value too when restoring persisted state, so it falls
  through to the new dynamic default instead of getting stuck.
- Check sibling components/screens sharing the same persisted key or concept
  for the same hardcoded-fallback pattern; fix all of them for consistency,
  not just the one screen where the bug was reported.
