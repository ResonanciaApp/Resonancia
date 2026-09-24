---
name: Biblioteca overlay sobre el drawer
description: La Biblioteca del menú lateral es un overlay deslizante, no una ruta.
---
La entrada "Biblioteca" del DrawerMenu NO navega: usa la ruta sentinela `__biblioteca_overlay` que llama `openLib()` del DrawerContext sin cerrar el drawer. `BibliotecaOverlay` (montado DESPUÉS de `<DrawerMenu />` en el root layout para quedar encima) se desliza derecha→izquierda con translateX y al cerrarse repliega dejando el drawer aún abierto debajo.

**Why:** el drawer es un overlay absoluto sobre el Stack, así que una ruta pusheada jamás puede taparlo; pedido explícito del usuario que el menú siga visible al volver.

**How to apply:** cualquier otra pantalla que deba abrirse "sobre el menú" debe seguir este patrón (estado en DrawerContext + overlay hermano posterior), no `router.push`. El overlay usa `BibliotecaScreen embedded` + header propio (back + título + lupa/+ vía onHeaderActions), replicando el patrón de ProfileScreenBase.

Los detalles que sí usan una ruta raíz (playlists y carpetas) deben montarse antes de retirar el overlay de Biblioteca y conservar explícitamente ese origen. Si el drawer sigue abierto, cerrarlo también al abrir el detalle: una ruta raíz queda detrás del drawer. Al volver —también con el botón físico de Android— reabrir el drawer si Biblioteca nació allí y luego Biblioteca antes de hacer pop; de lo contrario aparece por un instante la tab inferior y “Atrás” termina en Recursos.

La edición de una mezcla desde Biblioteca es distinta: debe abrirse como una capa encima de Biblioteca, dejando montados Biblioteca y su tab actual. Al volver se cierra solo esa capa. No navegar a la ruta raíz desde el lápiz ni forzar el tab «Mezclas» al regresar.

**Why:** una ruta raíz queda debajo de los overlays de Biblioteca/drawer, y reabrir Biblioteca con un tab fijo cambia la selección sin acción del usuario.

**How to apply:** distinguir los destinos que reemplazan temporalmente Biblioteca (playlists/carpetas) de los que se superponen a ella (edición de mezcla); mantener el orden de capas en el root layout.

La entrada y la salida del overlay deben animar en paralelo desplazamiento y opacidad, usando la misma curva y duración, para evitar que abrir Biblioteca se sienta brusco frente a su cierre.

Los overlays que nacen desde el drawer (Diario, Mis sesiones, Favoritos, Historial, Amigos y Grupos) deben animar también el NavStack de fondo −56 px en paralelo, igual que Mezclador. Biblioteca conserva ese parallax y oculta por completo la tab bar.

**Why:** Biblioteca funciona como una pantalla completa sobre el drawer; reservar o pintar una franja inferior para la tab bar genera recortes y deja ver el fondo de Inicio detrás del menú.

**How to apply:** cuando `libOpen` sea true, `CustomTabBar` debe tratar Biblioteca como superficie oculta (`tabBarHidden`) y `BibliotecaOverlay` debe ocupar todo el alto, sin `bottom` reservado. El drawer también conserva su altura completa.
