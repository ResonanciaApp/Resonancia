---
name: Biblioteca overlay sobre el drawer
description: La Biblioteca del menú lateral es un overlay deslizante, no una ruta.
---
La entrada "Biblioteca" del DrawerMenu NO navega: usa la ruta sentinela `__biblioteca_overlay` que llama `openLib()` del DrawerContext sin cerrar el drawer. `BibliotecaOverlay` (montado DESPUÉS de `<DrawerMenu />` en el root layout para quedar encima) se desliza derecha→izquierda con translateX y al cerrarse repliega dejando el drawer aún abierto debajo.

**Why:** el drawer es un overlay absoluto sobre el Stack, así que una ruta pusheada jamás puede taparlo; pedido explícito del usuario que el menú siga visible al volver.

**How to apply:** cualquier otra pantalla que deba abrirse "sobre el menú" debe seguir este patrón (estado en DrawerContext + overlay hermano posterior), no `router.push`. El overlay usa `BibliotecaScreen embedded` + header propio (back + título + lupa/+ vía onHeaderActions), replicando el patrón de ProfileScreenBase.

Los detalles que sí usan una ruta raíz (playlists y carpetas) deben montarse antes de retirar el overlay de Biblioteca y conservar explícitamente ese origen. Al volver —también con el botón físico de Android— se reabre Biblioteca antes de hacer pop; de lo contrario aparece por un instante la tab inferior y “Atrás” termina en Recursos.

La entrada y la salida del overlay deben animar en paralelo desplazamiento y opacidad, usando la misma curva y duración, para evitar que abrir Biblioteca se sienta brusco frente a su cierre.

Los overlays que nacen desde el drawer (Diario, Mis sesiones, Favoritos, Historial, Amigos y Grupos) deben animar también el NavStack de fondo −56 px en paralelo, igual que Mezclador. Biblioteca es la excepción: debe dejar el NavStack y la tab bar centrados para no recortar el extremo derecho de la barra.

Cuando Biblioteca está abierta, el drawer debe reservar también la franja inferior de la tab bar. BibliotecaOverlay queda por encima del drawer y deja esa franja libre; si el drawer conserva altura completa, tapa la barra salvo por el extremo derecho.

**Why:** el tab bar vive dentro del NavStack, pero DrawerMenu y BibliotecaOverlay son hermanos montados encima; dejar libre la franja solo en BibliotecaOverlay no basta para que la barra sea visible completa.

**How to apply:** usar la misma reserva calculada para la tab bar (`68 + tabBarBottom`) en el bottom del drawer únicamente mientras `libOpen` sea true, con `tabBarInset = 8` en web y `insets.bottom` en nativo. En `PushWrapper` y `CustomTabBar`, no aplicar parallax horizontal cuando `libOpen` sea true.

La franja inferior reservada debe tener una base oscura propia detrás de la tab bar. Si queda transparente, aparece el fondo de Inicio debajo del menú aunque la barra esté correctamente alineada.
