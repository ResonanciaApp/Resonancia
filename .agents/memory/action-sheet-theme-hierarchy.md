---
name: Action sheet background theme hierarchy
description: How "..." menu (action sheet) backgrounds map to scene theme across the app, by UI level
---

Action sheets ("..." 3-dot menus) follow a leveled convention for background color, tied to `useSceneTheme()`:

- **Biblioteca** (MixActionsSheet, PlaylistActionsSheet, FavoriteActionsSheet para mezclas, playlists y carpetas) — fondo SÓLIDO con el tercer stop `theme.gradient[2]`, con fallback al segundo y luego al primero.
- **Otras hojas Nivel 1 & 2** (por ejemplo SessionActionsSheet) — conservan su tratamiento específico mientras no haya una instrucción visual nueva.
- **Nivel 3** (player.tsx options sheet) — background = SOLID fill using only the lighter stop, `theme.gradient[0]`, as a plain `View` absoluteFill (not a LinearGradient with two similar colors).
- **Nivel 4** (Geometrix) — explicitly excluded; has its own fixed color scheme, never theme-linked.
- **Nivel 5** (Diario, Grupos) — cannot be themed. Diario's menu is a native OS `Alert` (no custom background support). Grupos' "..." buttons are still placeholder `Pressable`s with no attached menu implemented.

**Why:** las hojas de gestión de Biblioteca deben igualar el tratamiento plano de su menú de ordenamiento usando el tono más profundo del tema; Geometrix mantiene identidad propia.

**How to apply:** en Biblioteca, cualquier hoja abierta por long press sobre mezcla, playlist o carpeta usa el tercer stop sólido. Fuera de Biblioteca, revisar la convención local antes de cambiar el fondo.
