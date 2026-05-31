---
name: Mi Música sound mixer
description: How the myNoise-style ambient mixer is wired and the gating/activation rules that aren't obvious from code
---

# Mi Música — mezclador de sonidos ambiente

myNoise-style: el usuario superpone varios loops ambiente, cada uno con su slider de volumen, guarda mezclas (presets) y usa el sleep timer.

## Activación de un sonido (slot pattern)
Un sonido se "enciende" solo cuando existe su archivo en `SOUND_MAP` (config/sound-map.ts). El catálogo (`data/sounds.ts`) lista 15 sonidos siempre; los que no tienen entrada en `SOUND_MAP` renderizan "Próximamente" y están deshabilitados. Para activar uno: dropear el loop mp3 en `assets/audio/mixer/` y descomentar su línea en `SOUND_MAP` keyed por el id del sonido (lluvia, tormenta, oceano, etc.). `hasSoundFile(id)` = existe en SOUND_MAP.

## Engine
`MixerContext` corre un `AudioPlayer` (expo-audio `createAudioPlayer`) por sonido activo, en un `Map` (`playersRef`), máx `MAX_ACTIVE_SOUNDS=5`. Mismo primitivo que PlayerContext (que ya corre 3 players main/voice/ambient con volumen independiente).

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
- **El audio de la mezcla NO es background: se detiene al salir de la pantalla.** Decisión de producto (confirmada por el usuario): a diferencia de las sesiones (que tienen MiniPlayer global vía PlayerContext), la mezcla solo suena mientras estás en el mezclador. Implementado con `useFocusEffect(() => () => stopAll())` en `app/(tabs)/musica.tsx` y `mezclas/[category].tsx` (las dos únicas pantallas que montan MixerPanel). `stopAll()` es idempotente, así que el doble-stop con la celebración de guardado (que ya llama stopAll antes de navegar) es inofensivo. Si agregás otra pantalla que monte el mezclador, replicá el focus-effect o el audio se "fuga".
