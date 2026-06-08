---
name: Geometrix intro audio (logo reveal)
description: Por qué el sonido del logo reveal de Geometrix se precarga en el root layout y suena una sola vez por lanzamiento
---

El audio del "logo reveal" (cubo-3 FadeIn) de la pestaña Geometrix vive en un
singleton de módulo (`lib/geometrixIntro.ts`), NO en un ref del componente.

**Regla 1 — precargar en el ROOT layout, no al montar la pestaña.**
Las pestañas de Expo Router (`(tabs)`) se montan de forma PEREZOSA en su primer
foco. Si el player se crea en un `useEffect([])` del componente de la pestaña, el
decode arranca recién al entrar → delay perceptible (se vio ~5s la primera vez).
Solución: `preloadGeometrixIntro()` desde un `useEffect([])` del root
`app/_layout.tsx` (siempre montado al arrancar). Con segundos de anticipación el
primer `play()` arranca al instante y sincroniza con el FadeIn.
**Why:** el componente lazy no existe hasta el foco; precargar ahí siempre llega tarde.

**Regla 2 — one-shot por lanzamiento de app vía flag de módulo.**
`played` a nivel de módulo persiste entre blur/focus de la pestaña pero se
resetea al reiniciar la app (el módulo se recarga). Así suena solo la primera
vez que el usuario abre la app y entra a Geometrix; volver a la pantalla NO
repite. Para esto, NO usar AsyncStorage (debe sonar de nuevo en cada apertura de
app) y NO usar un `useRef` del componente (se pierde si la pestaña se remonta).

**Detalles de robustez (importan para no "perder" la única reproducción):**
- `loadStarted` se bloquea SOLO tras crear el player con éxito → si
  `createAudioPlayer` falla, un próximo preload reintenta en el mismo lanzamiento.
- `played` se marca SOLO si `p.play()` no lanzó → un error transitorio no gasta
  el one-shot.
- Si en el primer foco el player aún es null, NO se consume el one-shot (se
  reintenta en el próximo foco).
- Primer `play` no necesita `seekTo(0)`: el player está fresco en pos 0 → play
  sin `await` = arranque inmediato.

Exclusividad: la música de Geometrix llama `stopGeometrixIntro()` antes de
reproducir; el cleanup de `useFocusEffect` también pausa el intro.
