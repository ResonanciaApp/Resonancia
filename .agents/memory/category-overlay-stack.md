---
name: Category overlay stack
description: Pantallas de categoría y detalle (session/mezcla/tema/chakra) abren como pila de overlays bajo el tab bar, no como rutas root
---

La regla: cualquier pantalla que deba mostrarse CON el tab bar visible se abre vía `openCategory(route)` del CategoryOverlayContext, nunca con `router.push`.

**Cómo funciona:**
- `CategoryOverlayContext` guarda una PILA `{key, route}`; `openCategory` apila, `closeCategory` saca el tope. Soporta categoría → detalle → detalle.
- `CategoryOverlay` se renderiza dentro del prop `tabBar` de `<Tabs>` ANTES de `<CustomTabBar>`: así la barra queda siempre encima (las capas son absolutas; siblings posteriores ganan).
- Rutas parametrizadas se parsean del string (`/session/:id`, `/mezcla/:id`, `/tema/:id`, `/chakra/:id`) y el id se pasa como PROP a la pantalla; las 4 pantallas aceptan `{ id?: string }` con fallback a `useLocalSearchParams`.
- Botón volver: `useBackOverride()` (provisto por cada capa) → cierra la capa; fuera de overlay usa `router.back()`.
- Componentes compartidos (SessionRow, useSessionGate en PremiumBadge, ActivityFeedCard, BibliotecaScreen search) usan `useCategoryOverlayOptional()`: contexto presente = dentro de tabs → overlay; null = ruta root → `router.push` normal. Esa presencia/ausencia del provider ES el detector de contexto.

**Why:** el usuario pidió que el tab bar quede visible sobre Dormir/Música/Meditaciones/Sesiones y sobre los detalles de sesión/mezcla/tema/chakra; las rutas root tapan la barra sin remedio.

**How to apply:** al agregar un nuevo punto de entrada a estas pantallas desde una tab, usa openCategory (u optional hook en componentes compartidos). Rutas root (tag, serie, chat, resonador-perfil) siguen con router.push — ahí el overlay abriría DETRÁS de la pantalla actual. inicio5/inicio6 son legacy ocultas y no se migraron.
