---
name: Session detail screen linked to Escenas
description: app/session/[id].tsx (Música/Sesiones/Meditaciones shared detail) now reacts to the active Scene theme instead of a hardcoded per-category burgundy palette
---

`app/session/[id].tsx` is the single shared detail screen for three
category routes (`category/musica-sonidos.tsx`,
`category/sonidos-ancestrales.tsx`, `category/meditaciones-guiadas.tsx`).
It previously hardcoded a burgundy `CATEGORY_BG` map (identical values for
every category — effectively dead differentiation). It now reads
`useSceneTheme()` (`@/context/SceneThemeContext`) so its background/
gradient changes with the active Escena, joining the other screens listed
in `scene-visual-theme.md`.

**Sticky header color rule:** uses `sceneTheme.gradient[0]` (the "start"
stop), which is consistently the lighter of the two gradient stops across
all 5 scene defs in `config/scene-themes.ts` — safe to reuse this
convention ("first gradient stop = lighter/start color") elsewhere.

**Back-button pill:** the `GlowPill` component's background is now a flat
`rgba(0,0,0,0.015)` for all scenes (no longer a per-category/per-scene
`LinearGradient`) — a deliberate simplification requested by the user, not
a bug. Don't reintroduce gradientColors on GlowPill without checking this
was superseded intentionally.
