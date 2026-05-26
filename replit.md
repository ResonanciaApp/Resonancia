# RESONANCIA — Casa del Cuenco

App de meditación y sueño en español (Expo SDK 54). Estética oscura y cálida (bronce/dorado).

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, React Native, expo-av para audio
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/mobile/data/sessions.ts` — todas las sesiones, tipos de tags, helper functions
- `artifacts/mobile/data/tags.ts` — ThemeTag, SleepTag, TagCard, SleepTagCard
- `artifacts/mobile/config/audio-map.ts` — AUDIO_MAP, VOICE_MAP, AMBIENT_MAP, LOOP_SESSIONS
- `artifacts/mobile/context/PlayerContext.tsx` — reproductor de audio, timer, favoritos
- `artifacts/mobile/context/AuthContext.tsx` — registro e isRegistered
- `artifacts/mobile/context/UserProfileContext.tsx` — perfil del usuario (nombre, apellido, locación, descripción, foto)
- `artifacts/mobile/assets/audio/` — archivos MP3
- `artifacts/mobile/assets/images/sessions/` — imágenes de sesiones (session-1.png … session-28.png)

## Subir una nueva sesión

El usuario envía los datos con este formato:

```
Categoria:
Subcategoria:
Titulo:
Descripción:
Duración:
Grupo 1:      ← ThemeTag (ej: "Para la ansiedad") — dejar vacío si no aplica
Grupo 2:      ← SleepTag (ej: "Sonidos Binaurales") — dejar vacío si no aplica
Nombre Audio 1:
Nombre Audio 2:  ← dejar vacío si no aplica
```

El usuario adjunta los archivos de audio. Los pasos para agregarla:

1. **Copiar audios** → `artifacts/mobile/assets/audio/`
2. **Copiar imagen** (si la hay) → `artifacts/mobile/assets/images/sessions/session-N.png`
3. **Agregar sesión** a `artifacts/mobile/data/sessions.ts` con el próximo ID disponible
4. **Actualizar `artifacts/mobile/config/audio-map.ts`**:
   - `AUDIO_MAP` → audio 1 siempre
   - Audio 2 según categoría:
     - Meditaciones Guiadas → `VOICE_MAP` (voz regulable)
     - Música y Sonidos / Sonidos Ancestrales (loop) → `AMBIENT_MAP` (capa ambiente)
     - Sonidos Ancestrales (duración fija) → `VOICE_MAP` (se superpone al principal)
   - `LOOP_SESSIONS` → agregar ID si la sesión debe repetirse (Música y Sonidos)

### Reglas de audio por categoría

| Categoría | Timer en player | Audio 2 va en | Loop |
|---|---|---|---|
| Sonidos Ancestrales | ✅ sí | VOICE_MAP | No (duración fija) |
| Música y Sonidos | ❌ (usa picker previo) | AMBIENT_MAP | ✅ Sí → LOOP_SESSIONS |
| Meditaciones Guiadas | ❌ | VOICE_MAP | No |
| ASMR / Historias / Podcast | ❌ | — | No |

### Mapeo de campos a tipos

| Campo del formulario | Campo en Session |
|---|---|
| Categoria | `categoryId` + `categoryLabel` |
| Subcategoria | `ancestralTag` / `soundTag` / `meditationTag` / etc. |
| Grupo 1 | `themeTag: [...]` |
| Grupo 2 | `sleepTag` |

## User preferences

- Idioma: español en toda la UI
- Colores: bg `#18110C`, primary `#C69B4F`, accent `#D6A85B`, card `#24160F`, fg `#EDE1D3`
- Pre-existing TS errors (ignorar): VozInterior, MensajesAnon, MiniPlayer, session/[id], SessionCard, PlayerContext, player.tsx

## Gotchas

- El próximo ID de sesión disponible es el número más alto en `sessions.ts` + 1. Verificar con `grep -n '"id":' sessions.ts | tail -10`
- Si no se adjunta imagen, reutilizar `session-2.png` como placeholder y notificarlo
- NEVER agregar sesiones fuera del array `SESSIONS = [...]` — siempre antes del `];` de cierre
- LOOP_SESSIONS usa IDs como strings: `"20"`, no `20`

## Pendientes (recordar más adelante)

- **Configuraciones → "Actividad de la comunidad"**: hoy solo guarda la preferencia local. Cuando exista backend de notificaciones, enchufar push real (suscribir/desuscribir según toggle).
- **Configuraciones → "Términos y privacidad"**: el Alert ofrece abrir `https://resonancia.app` como placeholder. Reemplazar por el link real cuando esté.
- **Configuraciones → "Calificar la app"**: hoy muestra "Próximamente". Cuando se publique en stores, abrir el link nativo (`expo-store-review` o `Linking` a la store URL).

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
