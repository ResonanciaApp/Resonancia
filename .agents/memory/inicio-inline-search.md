---
name: Inicio inline search (buscador desplegable)
description: How the Home (Inicio) screen search field expands from the lupa icon without a modal, and how it coexists with the scroll-driven loto→lupa transform.
---

The lupa icon on Inicio (`app/(tabs)/index.tsx`) already had a scroll-driven loto↔lupa icon crossfade (`searchIconAnim`, RN `Animated`, tracked via `isSearchModeRef`). That transform is independent of search UI state — do not couple them beyond reading `isSearchModeRef.current` to decide the button's tap action.

Pattern used for the inline (non-modal) expandable search field:
- Two absolutely-positioned sibling layers (nav-tabs row vs. search input) share one flex host (`headerRowHost`), each with `opacity`/`translateX` driven by a single Reanimated shared value (`searchOpenSV`). This avoids layout width animation entirely (no jank, no flex/width relayout) — the host's width never changes.
- `pointerEvents` is toggled per-layer (`"auto"`/`"none"`) so the hidden layer doesn't intercept taps.
- The lupa/close button is a single tri-state icon: loto (scroll-based) / lupa (scroll-based) / close-X (only when search is open, overriding the scroll icon).
- Outside-tap-to-close uses a full-screen absolutely-positioned `Pressable` sibling placed *after* the header in the tree but with a lower `zIndex` than the sticky header, so header taps (including the results dropdown) still work while taps elsewhere close the search.

**Why:** the task explicitly forbade a `Modal`/new screen (unlike the existing `BibliotecaScreen.tsx` `SearchOverlay`, which *is* a full-screen `Modal` — don't reuse that pattern here, only its result-matching logic (filter `SESSIONS` by title/categoryLabel/subtitle) is transferable, not its UI.
