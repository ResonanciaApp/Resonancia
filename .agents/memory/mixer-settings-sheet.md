---
name: Mixer settings sheet (Ajustes del Mezclador)
description: Where the Mezclador filter/background settings live and the persisted-key validation rule
---

# Ajustes del Mezclador

El engranaje del Mezclador (`app/(tabs)/musica.tsx`) abre `MixerSettingsSheet`: filtro por ánimo (`MOOD_SOUND_TAGS` en `data/moods.ts`), filtro por etiquetas de sonido (`SoundTagId`/`SOUND_TAGS` en `data/sounds.ts`, varias por sonido) y paleta de fondo del área de cards (`data/mixer-bg-palettes.ts`, NO afecta el header). "Mis mezclas" se movió a un ícono bookmark aparte.

**Estado local, sin context:** todo vive como `useState` en `musica.tsx` y se pasa al sheet por props; se persiste en AsyncStorage (`@resonance_mixer_settings_v1`) con un `settingsLoaded` ref que evita pisar lo guardado en el primer render.

**Regla (bug encontrado):** los valores persistidos que se usan como CLAVE de un mapa (ej. `MOOD_SOUND_TAGS[moodFilter]`) DEBEN validarse al cargar contra los valores actuales (`moodFilter in MOOD_SOUND_TAGS`, filtrar tagFilters contra SOUND_TAGS, normalizar bgPaletteId con `getMixerBgPalette`).

**Why:** un valor obsoleto/corrupto da `undefined` y `new Set([...undefined])` crashea el filtrado (no iterable). Defensa extra en el cómputo: `MOOD_SOUND_TAGS[moodFilter] ?? []`.

**How to apply:** cada vez que se sume un nuevo ajuste persistido que indexe un mapa/enum, validarlo en la carga; no confiar en lo que haya en AsyncStorage.
