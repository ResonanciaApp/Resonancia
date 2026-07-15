---
name: Session tap three-state logic
description: Orden de prioridad al tocar una card de sesión (skipMiniPlayer > skipDetail > detalle) y dónde vive esa lógica duplicada
---

Al tocar una sesión hay TRES destinos posibles, en este orden de prioridad:

1. `skipMiniPlayer` → `playSession(s); return;` — reproduce al instante, SOLO aparece el miniplayer, no se navega a ninguna pantalla.
2. `skipDetail` (o categoría en `SKIP_DETAIL_CATS = ["sonidos-ancestrales","musica-sonidos"]` en SessionCard) → `playSession(s); router.push("/player")`.
3. Default → `router.push("/session/[id]")` (pantalla de detalle).

**Why:** el admin puede marcar sesiones para que suenen sin abrir pantallas (toggle "Pasar directo al miniplayer", mutuamente excluyente con skipDetail en la UI del admin; el server NO fuerza la exclusión — el mobile prioriza skipMiniPlayer, así que es determinístico igual).

**How to apply:** la lógica está duplicada en ~22 sitios de tap: SessionCard, SessionRow, PremiumBadge, HistorialCalendar, category/{meditaciones-guiadas,sonidos-ancestrales,musica-sonidos}, y en inicio5/6/8 + explore (incluyendo onPress INLINE de los carruseles `onPress={(s) => { if (...) }}` — SessionCarousel dispara su propio Pressable, el check de SessionCard NO aplica ahí). Al agregar un nuevo punto de tap o un nuevo flag, cubrir TODOS los sitios; un grep útil: `grep -rn "skipDetail" app components | grep -v skipMiniPlayer` y revisar la línea anterior de cada hit.

Gotcha de scripting: si se parchea masivo con regex anclado a `^\s*if`, se pierden los `if` inline a mitad de línea (los onPress de carruseles) — verificar el conteo total antes de dar por cerrado.
