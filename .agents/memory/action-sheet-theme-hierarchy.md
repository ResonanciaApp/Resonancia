---
name: Action sheet background theme hierarchy
description: How "..." menu (action sheet) backgrounds map to scene theme across the app, by UI level
---

Action sheets ("..." 3-dot menus) follow a leveled convention for background color, tied to `useSceneTheme()`:

- **Biblioteca** — solo Cloudy: acciones al mantener pulsadas mezclas, playlists, carpetas y resonadores usan el último stop sólido. Creación, menú + y Agrega Resonador usan los cuatro primeros stops. Los demás temas conservan tercer stop para acciones y último para creación.
- **Otras hojas Nivel 1 & 2** (por ejemplo SessionActionsSheet) — conservan su tratamiento específico mientras no haya una instrucción visual nueva.
- **«Escoge tu duración» Ambiental** — Cloudy usa los cuatro primeros stops y la dirección del tema; Índigo 2 usa segundo/tercer stop de Tibet; los demás, segundo/tercer stop propios.
- **Nivel 3** (player.tsx options sheet) — background = SOLID fill using only the lighter stop, `theme.gradient[0]`, as a plain `View` absoluteFill (not a LinearGradient with two similar colors).
- **Nivel 4** (Geometrix) — explicitly excluded; has its own fixed color scheme, never theme-linked.
- **Nivel 5** (Diario, Grupos) — cannot be themed. Diario's menu is a native OS `Alert` (no custom background support). Grupos' "..." buttons are still placeholder `Pressable`s with no attached menu implemented.

**Why:** El usuario reemplazó expresamente el tratamiento de Biblioteca solo en Cloudy, diferenciando los menús de pulsación larga y las ventanas de creación. Son superficies distintas; Geometrix conserva identidad propia.

El selector Ambiental conserva un degradado, no un fondo liso de Biblioteca. Sus excepciones de Cloudy e Índigo 2 forman parte de ese tratamiento.

«Vuelve a ti» (luna de Dormir) comparte exactamente el degradado del selector de duración Ambiental, incluidos stops, distribución y dirección de Cloudy. El recordatorio de mañana conserva su fondo independiente.

**Why:** El usuario pidió igualar la ventana de la luna al temporizador de las cards Ambientales de Sonidos, no al temporizador general del reproductor.

**How to apply:** Si cambia el fondo del selector Ambiental, mantener sincronizado el de la luna. No extender ese cambio al recordatorio de mañana ni a sus controles.

Las ventanas Categoría y Tiempo de Búsqueda desde «Explora según tu tiempo» comparten el fondo del selector de duración. Sus opciones son negras al 19 % solo en Cloudy y al 16 % en Índigo 2.

**Why:** El usuario pidió igualar esas dos ventanas al temporizador de cada tema, no al menú de acciones de Biblioteca.

**How to apply:** Conservar también la excepción del temporizador en Índigo 2; la selección de una opción no debe blanquear el fondo de sus píldoras.

**How to apply:** Aplicar la excepción de Cloudy solo en Biblioteca; fuera de ella, mantener la convención local. La confirmación de resonadores en Cloudy requiere panel propio: Alert nativo no permite elegir fondo; otros temas conservan su alerta.
