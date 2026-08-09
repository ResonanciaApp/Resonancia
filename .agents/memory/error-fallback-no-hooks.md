---
name: ErrorFallback no context hooks
description: ErrorFallback.tsx must never use context hooks (useColors, useSceneTheme, useAuth…) because ErrorBoundary wraps the entire provider tree.
---

## Rule
`ErrorFallback` must use **hardcoded colors** — no `useColors()`, `useSceneTheme()`, or any other context hook.

**Why:** `ErrorBoundary` in `_layout.tsx` wraps the entire provider tree (including `SceneThemeProvider`, `AuthProvider`, `QueryClientProvider`). When any error occurs and `ErrorFallback` renders, it is outside ALL providers. Calling `useColors()→useSceneTheme()` throws `"useSceneTheme must be inside SceneThemeProvider"`, creating a cascade crash that shows "Render Error" instead of the recovery UI.

**How to apply:** Any time `ErrorFallback` is edited, use the hardcoded palette constant:
```ts
const EC = {
  background: "#060A0F",
  foreground: "#F9F9F9",
  mutedForeground: "rgba(249,249,249,0.55)",
  card: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.10)",
  primary: "#BE9650",
  primaryForeground: "#060A0F",
} as const;
```
Do NOT import `useColors`, `useSceneTheme`, `useAuth`, `useQuery`, or any other hook that requires a provider.
