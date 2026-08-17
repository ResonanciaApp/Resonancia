---
name: Chat overlay sobre Amigos
description: El chat de DM se abre como overlay apilado sobre el overlay de Amigos, no por router.push
---
Regla: desde pantallas que viven en DrawerScreenOverlay (amigos, diario, etc.), `router.push` monta la ruta DEBAJO del overlay y no se ve. El chat se abre vía `openChat(userId)` del DrawerContext → `components/ChatOverlay.tsx` (capa que desliza sobre Amigos; Amigos queda abierto debajo, igual que el drawer bajo Amigos).

**Why:** el usuario quiere volver del chat a Amigos con ←; cerrar Amigos y pushear rompía esa expectativa y la ruta pusheada quedaba oculta.

**How to apply:** ChatScreen acepta prop `userIdOverride` y usa `useBackOverride()` para el botón ←. Cualquier otra navegación desde un overlay del drawer debe cerrar el overlay primero (`closeOverlay()` antes de push, ej. /usuario/:id) o sumarse al patrón de capas.
