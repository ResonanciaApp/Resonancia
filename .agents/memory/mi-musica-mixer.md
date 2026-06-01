---
name: Mi Música sound mixer
description: How the myNoise-style ambient mixer is wired and the gating/activation rules that aren't obvious from code
---

# Mi Música — mezclador de sonidos ambiente

myNoise-style: el usuario superpone varios loops ambiente, cada uno con su slider de volumen, guarda mezclas (presets) y usa el sleep timer.

## Activación de un sonido (slot pattern)
Un sonido se "enciende" solo cuando existe su archivo en `SOUND_MAP` (config/sound-map.ts). El catálogo (`data/sounds.ts`) lista 15 sonidos siempre; los que no tienen entrada en `SOUND_MAP` renderizan "Próximamente" y están deshabilitados. Para activar uno: dropear el loop mp3 en `assets/audio/mixer/` y descomentar su línea en `SOUND_MAP` keyed por el id del sonido (lluvia, tormenta, oceano, etc.). `hasSoundFile(id)` = existe en SOUND_MAP.

## Engine
`MixerContext` corre un `AudioPlayer` (expo-audio `createAudioPlayer`) por sonido activo, en un `Map` (`playersRef`), máx `MAX_ACTIVE_SOUNDS` (10). Mismo primitivo que PlayerContext (que ya corre 3 players main/voice/ambient con volumen independiente).

## Reglas que NO son obvias
- **Premium gating de presets se sanea en el HOOK `useLoadMix`, no en el context.** `MixerContext` es premium-agnóstico (solo filtra por `SOUND_MAP`). `hooks/useLoadMix.ts` filtra los sonidos premium antes de cargar el preset y devuelve boolean. Cualquier pantalla que cargue mezclas debe usar `useLoadMix` — el context NO protege.
  - **Why:** gating premium en esta app es solo-UI (igual que sesiones/videos); meter premium en el context lo acoplaría innecesariamente.

## Estructura UI (MixerPanel + categorías)
- El mezclador activo + timer + modal de guardar viven en `components/MixerPanel.tsx` (componente compartido). Lo usan `app/(tabs)/musica.tsx` y `app/mezclas/[category].tsx`. Devuelve null si no hay mezcla activa.
- `MixerPanel` recibe `currentCategory?`. Al guardar dispara `SaveMixCelebration` (overlay animado: el token de la mezcla "vuela" a la categoría + mensaje "Guardaste tu mezcla en {cat}"). Al terminar la animación (`onDone`): `stopAll()` cierra/colapsa el mezclador y si `savedCategory !== currentCategory` navega a `/mezclas/<cat>`.
  - El efecto de animación en `SaveMixCelebration` depende SOLO de `[visible]` a propósito: `onDone` se recrea en cada render, meterlo en deps re-dispararía la animación a mitad de vuelo.
- **"Mezcla ya guardada" = origin-based, NO composición exacta.** `MixerContext.loadedPresetId` marca que la mezcla activa proviene de un preset guardado para ocultar el botón Guardar (no re-guardar lo ya guardado). Regla: cualquier cambio ESTRUCTURAL lo limpia (agregar/quitar sonido, stopAll, borrar ese preset); cambiar volumen NO (sigue siendo "la misma" mezcla). Cargar con `useLoadMix` filtrado (premium/sin archivo) igual lo marca como guardado: importa el origen, no que suene idéntico. Si agregás un nuevo punto donde la mezcla cambie de forma, acordate de limpiar `loadedPresetId`.
- Categorías de mezclas en `data/mix-categories.ts` (dormir/trabajar/motivarme), cada una con `icon: FeatherIconName`. Las cards en Mi Música son icono sobre fondo gris translúcido (no imágenes); el hero de cada categoría sí mantiene `meta.image` + muestra `meta.icon`.
- **Curated mixes eliminadas.** Ya no existe `data/curated-mixes.ts` ni el campo `isCurated`. Abrir una mezcla guardada solo llama `loadMix(mix)` (sin navegar de vuelta).
- **No agregar sonidos "fantasma":** `toggleSound`/`loadPreset` solo mutan `activeSounds`/`isPlaying` si `createPlayerFor` devolvió un player (archivo presente). Si falla, no se cuenta contra el límite de 5 ni marca isPlaying.
- **Sleep timer se resetea (`clearSleepTimer`) cuando la mezcla queda vacía y al cargar un preset**, para que un timer viejo no pause una mezcla nueva.
- **El audio de la mezcla SÍ es background + MiniPlayer global + lock screen** (revertido — antes se detenía al blur con `useFocusEffect(stopAll)`, eso ya NO existe). Confirmado por el usuario. La mezcla ahora se comporta como una sesión: sigue sonando al navegar, aparece en el MiniPlayer global (cuando no hay sesión) y controla el Now Playing / pantalla bloqueada.
  - **Mezcla y sesión son MUTUAMENTE EXCLUYENTES** porque comparten el slot de Now Playing. Se coordinan vía `context/audioBridge.ts` (singleton register*Stopper/stop*Playback). PlayerProvider envuelve a MixerProvider, así que NO se pueden acoplar por contexto en ambos sentidos — el bridge desacopla. PlayerContext llama `stopMixPlayback()` en playSession/playSessionWithDuration; MixerContext llama `stopSessionPlayback()` al iniciar/reanudar (toggleSound/togglePlay/loadPreset).
  - **Lock screen de la mezcla = un player "ancla" (owner).** La mezcla son N loops sin pista principal; se designa el primer player del Map como owner del Now Playing (`lockOwnerRef`). Si se quita ese owner, se transfiere al siguiente (`syncLockScreen`); si no queda ninguno, se limpia. `setActiveForLockScreen` se difiere hasta `duration>0` (igual que sesiones: NaN → iOS descarta el Now Playing). El mirror de play/pausa remoto compara contra `isPlayingRef` para no entrar en bucle.
  - `MixerContext.applyPlaying(next)` es el único punto que pausa/reanuda todos los players + sincroniza `isPlayingRef` (sincrónico, lo lee el listener del lock screen).
  - Si agregás otra pantalla que monte el mezclador, NO repliques ningún stop-on-blur — el audio debe persistir.

## Mezclas de la comunidad — player dedicado (incógnito)
- Las mezclas compartidas (`shared_mixes`) se abren en `app/mezcla/[id].tsx` (NO se cargan en "Mi Música"). El carrusel `CommunityMixesCarousel` navega con `router.push('/mezcla/<id>')`.
- **Producto: la composición del creador es PRIVADA.** El player presenta la mezcla como un TODO — nunca muestra el desglose de sonidos ni los volúmenes. **Why:** el usuario lo pidió explícitamente ("incógnito"); no exponer el detalle de sonidos/sliders en este screen. Reproduce vía `useLoadMix` + `togglePlay` con `presetId='community-<id>'`.
- Comentarios: tabla `shared_mix_comments`, endpoints `GET/POST/DELETE /mixes/{id}/comments`. Hooks generados `useGetMixComments/useAddMixComment/useDeleteMixComment`. Like/comentar gateado para invitados → Alert → `/(auth)/sign-up`.
- **Notificaciones de like/comentario al creador:** tipos `mix_like`/`mix_comment` en `NOTIFICATION_TYPES`. La tabla `notifications` tiene `entityId` (nullable) que guarda el mixId → el tap rutea a `/mezcla/{entityId}`. Helper `notifyMixOwner` en `mixes.ts` (skip self). **Dedup de no leídas** vía índice parcial único `(userId, actorUserId, entityId, type) WHERE readAt IS NULL AND type IN (...)`. **El push solo se manda cuando se inserta una notificación NUEVA** (insert `.returning()`, si length 0 no hay push) — distinto del patrón DM que pushea en cada mensaje. **Why:** like/unlike/like repetido spammearía; acá se colapsa hasta que el creador la lee.
