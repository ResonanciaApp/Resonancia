---
name: Category overlay stack
description: Pantallas de categoría y detalle abren como pila de overlays; la visibilidad del tab bar debe derivarse también de esa pila
---

La regla: las pantallas que se abren vía `openCategory(route)` no cambian el pathname. Cualquier comportamiento global dependiente de la pantalla visible debe consultar también la pila del CategoryOverlayContext.

**Cómo funciona:**
- `CategoryOverlayContext` guarda una PILA `{key, route}`; `openCategory` apila, `closeCategory` saca el tope. Soporta categoría → detalle → detalle.
- `CategoryOverlay` se renderiza dentro del prop `tabBar` de `<Tabs>` ANTES de `<CustomTabBar>`: las capas son absolutas y la barra puede quedar encima salvo que su visibilidad se bloquee explícitamente.
- Rutas parametrizadas se parsean del string (`/session/:id`, `/mezcla/:id`, `/tema/:id`, `/chakra/:id`) y el id se pasa como PROP a la pantalla; las 4 pantallas aceptan `{ id?: string }` con fallback a `useLocalSearchParams`.
- Botón volver: `useBackOverride()` (provisto por cada capa) → cierra la capa; fuera de overlay usa `router.back()`.
- Componentes compartidos (SessionRow, useSessionGate en PremiumBadge, ActivityFeedCard, BibliotecaScreen search) usan `useCategoryOverlayOptional()`: contexto presente = dentro de tabs → overlay; null = ruta root → `router.push` normal. Esa presencia/ausencia del provider ES el detector de contexto.

**Why:** una pantalla de sesión puede seguir visible dentro del overlay mientras el pathname permanece en la tab de origen. Detectar solo `/session/*` falla al volver del reproductor y permite que reaparezca la barra.

**How to apply:** las categorías conservan la barra; el detalle de sesión es una excepción deliberada y la oculta mientras exista `/session/*` en la pila, incluso durante player → atrás. Para otras reglas globales, combina pathname + estado del overlay.
