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
- El mezclador activo + timer + modal de guardar viven en `components/MixerPanel.tsx` (componente compartido). Lo usan `app/mi-musica.tsx` y `app/mezclas/[category].tsx`. Devuelve null si no hay mezcla activa.
- `MixerPanel` recibe `currentCategory?`. Al guardar dispara `SaveMixCelebration` (overlay animado: el token de la mezcla "vuela" a la categoría + mensaje "Guardaste tu mezcla en {cat}"). Al terminar la animación (`onDone`): `stopAll()` cierra/colapsa el mezclador y si `savedCategory !== currentCategory` navega a `/mezclas/<cat>`.
  - El efecto de animación en `SaveMixCelebration` depende SOLO de `[visible]` a propósito: `onDone` se recrea en cada render, meterlo en deps re-dispararía la animación a mitad de vuelo.
- Categorías de mezclas en `data/mix-categories.ts` (dormir/trabajar/motivarme), cada una con `icon: FeatherIconName`. Las cards en Mi Música son icono sobre fondo gris translúcido (no imágenes); el hero de cada categoría sí mantiene `meta.image` + muestra `meta.icon`.
- **Curated mixes eliminadas.** Ya no existe `data/curated-mixes.ts` ni el campo `isCurated`. Abrir una mezcla guardada solo llama `loadMix(mix)` (sin navegar de vuelta).
- **No agregar sonidos "fantasma":** `toggleSound`/`loadPreset` solo mutan `activeSounds`/`isPlaying` si `createPlayerFor` devolvió un player (archivo presente). Si falla, no se cuenta contra el límite de 5 ni marca isPlaying.
- **Sleep timer se resetea (`clearSleepTimer`) cuando la mezcla queda vacía y al cargar un preset**, para que un timer viejo no pause una mezcla nueva.
