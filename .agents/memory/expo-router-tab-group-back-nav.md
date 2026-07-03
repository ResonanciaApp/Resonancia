---
name: Expo Router detail screens must live outside (tabs) group
description: Why a detail screen nested inside app/(tabs)/ breaks back navigation, and the fix
---

A route file placed inside `app/(tabs)/<name>/[id].tsx` becomes an implicit
hidden screen of the bottom `Tabs` navigator, even if it's never added to
`TAB_CONFIG` or `<Tabs.Screen>`. Its "back" resolves against the Tabs
navigator's own history/initial route, not the stack of whatever screen
pushed it — in practice this often means back always lands on the first tab
(Inicio) instead of returning to the tab the user came from (e.g. Biblioteca).

**Why:** the Tabs navigator owns its own back-stack semantics separate from
the root `Stack` in `app/_layout.tsx`. Only screens registered at the app
root (sibling of `(tabs)`) get normal stack push/pop behavior that returns to
whichever screen/tab actually navigated to them.

**How to apply:** any modal-like or detail screen reachable via
`router.push(...)` from inside tabs (playlist detail, mix detail, folder
detail, profile detail, etc.) belongs at `app/<name>/[id].tsx`, registered as
a `<Stack.Screen name="<name>/[id]">` in `app/_layout.tsx` — matching the
existing pattern used by `mezcla/[id]`, `carpeta-mezcla/[id]`, `mi-mezcla/[id]`,
`artista/[id]`, `guiador/[id]`. Do not add new nested detail routes under
`app/(tabs)/`, even if the URL path would look the same either way.
