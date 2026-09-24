---
name: Action sheet background theme hierarchy
description: How "..." menu (action sheet) backgrounds map to scene theme across the app, by UI level
---

Action sheets ("..." 3-dot menus) follow a leveled convention for background color, tied to `useSceneTheme()`:

- **Biblioteca** — acciones de mezclas y playlists, menú “+” y “Agrega Resonador” usan fondo SÓLIDO del último stop del gradiente activo. FavoriteActionsSheet conserva el tercer stop `theme.gradient[2]` (con fallback al segundo y primero).
- **Otras hojas Nivel 1 & 2** (por ejemplo SessionActionsSheet) — conservan su tratamiento específico mientras no haya una instrucción visual nueva.
- **Nivel 3** (player.tsx options sheet) — background = SOLID fill using only the lighter stop, `theme.gradient[0]`, as a plain `View` absoluteFill (not a LinearGradient with two similar colors).
- **Nivel 4** (Geometrix) — explicitly excluded; has its own fixed color scheme, never theme-linked.
- **Nivel 5** (Diario, Grupos) — cannot be themed. Diario's menu is a native OS `Alert` (no custom background support). Grupos' "..." buttons are still placeholder `Pressable`s with no attached menu implemented.

**Why:** el usuario pidió expresamente que acciones de mezcla y playlist, el menú “+” y “Agrega Resonador” usen el último stop del tema. Favoritos mantiene su convención previa; Geometrix conserva identidad propia.

**How to apply:** en Biblioteca, esas cuatro superficies usan el último stop sólido y Favoritos conserva el tercero; fuera de Biblioteca, revisar la convención local antes de cambiar el fondo.
