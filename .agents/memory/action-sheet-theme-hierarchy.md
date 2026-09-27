---
name: Action sheet background theme hierarchy
description: How "..." menu (action sheet) backgrounds map to scene theme across the app, by UI level
---

Action sheets ("..." 3-dot menus) follow a leveled convention for background color, tied to `useSceneTheme()`:

- **Biblioteca** — las ventanas de acciones al mantener pulsadas mezclas, playlists y carpetas usan fondo sólido del tercer stop del tema. Las acciones de Favoritos conservan también ese tercer stop. El menú “+” y “Agrega Resonador” siguen usando el último stop.
- **Otras hojas Nivel 1 & 2** (por ejemplo SessionActionsSheet) — conservan su tratamiento específico mientras no haya una instrucción visual nueva.
- **Nivel 3** (player.tsx options sheet) — background = SOLID fill using only the lighter stop, `theme.gradient[0]`, as a plain `View` absoluteFill (not a LinearGradient with two similar colors).
- **Nivel 4** (Geometrix) — explicitly excluded; has its own fixed color scheme, never theme-linked.
- **Nivel 5** (Diario, Grupos) — cannot be themed. Diario's menu is a native OS `Alert` (no custom background support). Grupos' "..." buttons are still placeholder `Pressable`s with no attached menu implemented.

**Why:** el usuario pidió expresamente el tercer stop para las acciones al mantener pulsado en Biblioteca, después de haber preferido el último stop para las ventanas de creación. Son superficies distintas; Geometrix conserva identidad propia.

**How to apply:** distinguir las acciones de pulsación larga (tercer stop) de las ventanas de creación y el menú “+” (último stop); fuera de Biblioteca, revisar la convención local antes de cambiar el fondo.
