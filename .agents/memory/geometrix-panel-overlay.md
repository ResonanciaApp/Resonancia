---
name: Geometrix panel overlay
description: Geometrix ya no se navega como ruta — abre como panel deslizante estilo Mezclador
---
Geometrix entra igual que el Mezclador: panel que desliza derecha→izquierda sobre la pantalla actual.

- `context/GeometrixPanelContext.tsx`: `openGeometrix(params?)` / `closeGeometrix` / `panelAnim` + `hasOpenedGeometrix` (montaje lazy: se monta en la primera apertura y queda montado) + params pendientes (`load/play/new/preloadId`) con `pendingVersion` (contador) para que reabrir con nuevos params re-dispare el efecto aunque ya esté abierto.
- Overlay montado en `app/(tabs)/_layout.tsx` junto al panel del mixer (mismos estilos mixerPanel/mixerBackdrop).
- En `geometrix.tsx`: `tabFocused = routeFocused || isGeometrixOpen`; efectos espejo del useFocusEffect (requestHide/showMenu, playIntro/cleanup) gateados por `isGeometrixOpen`; el botón atrás del landing cierra el panel si está abierto.
- TODAS las entradas usan `openGeometrix()` (inicio8, DrawerMenu, EscenasSheet, SceneAnimationModal, BibliotecaScreen ×5, geometrix-creaciones, geometrix-comunidad, geometrix-aprende). La ruta `/(tabs)/geometrix` sigue registrada (href:null) pero NADIE debe navegar a ella: si la ruta se monta además del overlay habría dos instancias compitiendo por los params pendientes y los efectos de intro/cleanup.
- `preloadId` se acepta pero se ignora (la ruta tampoco lo consumía).
- `showLanding` arranca en `true` (pintar landing desde el primer frame, sin flash del lienzo); abrir con `load`/`new` lo apaga en el efecto de params.
- Primera apertura: el montaje del screen pesado bloquea JS → la animación de entrada se difiere con doble `requestAnimationFrame` en `openGeometrix` (si no, se salta frames y "aparece de golpe").

**Why:** pedido del usuario ("que entre tal cual como el mezclador"); dos instancias del screen duplican efectos y consumen params ajenos.
**How to apply:** cualquier acceso nuevo a Geometrix debe llamar `openGeometrix(params)` — nunca `router.push/navigate` a la ruta.
