---
name: Biblioteca overlay sobre el drawer
description: La Biblioteca del menú lateral es un overlay deslizante, no una ruta.
---
La entrada "Biblioteca" del DrawerMenu NO navega: usa la ruta sentinela `__biblioteca_overlay` que llama `openLib()` del DrawerContext sin cerrar el drawer. `BibliotecaOverlay` (montado DESPUÉS de `<DrawerMenu />` en el root layout para quedar encima) se desliza derecha→izquierda con translateX y al cerrarse repliega dejando el drawer aún abierto debajo.

**Why:** el drawer es un overlay absoluto sobre el Stack, así que una ruta pusheada jamás puede taparlo; pedido explícito del usuario que el menú siga visible al volver.

**How to apply:** cualquier otra pantalla que deba abrirse "sobre el menú" debe seguir este patrón (estado en DrawerContext + overlay hermano posterior), no `router.push`. El overlay usa `BibliotecaScreen embedded` + header propio (back + título + lupa/+ vía onHeaderActions), replicando el patrón de ProfileScreenBase.
