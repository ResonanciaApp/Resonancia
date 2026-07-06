---
name: Action sheet background theme hierarchy
description: How "..." menu (action sheet) backgrounds map to scene theme across the app, by UI level
---

Action sheets ("..." 3-dot menus) follow a leveled convention for background color, tied to `useSceneTheme()` (`theme.gradient` = readonly `[lighter, darker]` tuple from `config/scene-themes.ts`):

- **Nivel 1 & 2** (item-management sheets: SessionActionsSheet, MixActionsSheet, PlaylistActionsSheet, FavoriteActionsSheet) — background = FULL two-stop gradient (`theme.gradient`), rendered as `<LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} pointerEvents="none" />` inserted as the first child inside the sheet's content `View` (after removing any hardcoded `backgroundColor` from the sheet's style object).
- **Nivel 3** (player.tsx options sheet) — background = SOLID fill using only the lighter stop, `theme.gradient[0]`, as a plain `View` absoluteFill (not a LinearGradient with two similar colors).
- **Nivel 4** (Geometrix) — explicitly excluded; has its own fixed color scheme, never theme-linked.
- **Nivel 5** (Diario, Grupos) — cannot be themed. Diario's menu is a native OS `Alert` (no custom background support). Grupos' "..." buttons are still placeholder `Pressable`s with no attached menu implemented.

**Why:** user wants menu chrome to visually match the currently selected ambient scene, but wants a visual distinction between full-gradient (item-level sheets) vs flat lighter-tone (in-player-context sheet) vs untouched (Geometrix has its own identity).

**How to apply:** when adding a new action sheet/menu, check which level it belongs to before choosing a background treatment; default assumption for a new "..." menu on a list item is Nivel 1/2 (full gradient).
