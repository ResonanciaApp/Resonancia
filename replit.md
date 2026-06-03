# RESONANCIA — Casa del Cuenco

App de meditación y sueño en español (Expo SDK 54). Estética oscura navy + dorado.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (port 5000)
- `pnpm --filter @workspace/resonancia-admin run dev` — panel admin web (`/admin/`)
- `pnpm run typecheck` — typecheck de todos los packages
- `pnpm run build` — typecheck + build de todos los packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerar hooks + Zod desde el OpenAPI spec
- `pnpm --filter @workspace/db run push` — push de cambios de schema DB (solo dev)
- Env requerido: `DATABASE_URL` (Postgres)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, React Native, expo-av/expo-audio para audio
- Web admin: react-vite + shadcn + Wouter + Clerk (cookie same-origin)
- API: Express 5 · DB: PostgreSQL + Drizzle ORM
- Validación: Zod (`zod/v4`), `drizzle-zod` · Codegen: Orval (desde OpenAPI) · Build: esbuild

## Where things live

- `artifacts/mobile/data/sessions.ts` — todas las sesiones, tipos de tags, helpers
- `artifacts/mobile/data/{tags,artists,guides,videos,sounds}.ts` — catálogos y tipos
- `artifacts/mobile/config/audio-map.ts` — AUDIO_MAP, VOICE_MAP, AMBIENT_MAP, LOOP_SESSIONS
- `artifacts/mobile/config/nature-base-map.ts` — base + ambient de Sonidos Naturaleza
- `artifacts/mobile/context/{PlayerContext,AuthContext,UserProfileContext}.tsx`
- `artifacts/mobile/assets/audio/` — MP3 · `assets/images/sessions/` — imágenes
- `artifacts/resonancia-admin/` — panel admin web (usuarios/roles, moderación, categorías, stats)
- `artifacts/api-server/src/routes/` — `admin.ts`, `catalog.ts`, `users.ts`, `activity.ts`, etc.
- `lib/api-spec/openapi.yaml` — contrato; `lib/api-client-react`, `lib/api-zod` — generados

## Subir una nueva sesión

El usuario envía los datos con este formato (adjunta los audios):

```
Categoria:        Subcategoria:      Titulo:        Descripción:      Duración:
Grupo 1:   ← ThemeTag (ej "Para la ansiedad") — vacío si no aplica
Grupo 2:   ← SleepTag (ej "Sonidos Binaurales") — vacío si no aplica
Premium:   ← "sí" / "no" (default no = free)
Nombre Audio 1:   Nombre Audio 2:  ← vacío si no aplica
```

Pasos:

1. **Copiar audios** → `assets/audio/`
2. **Copiar imagen** (si la hay) → `assets/images/sessions/session-N.png` (si no hay, reutilizar `session-2.png` como placeholder y avisar)
3. **Agregar sesión** a `data/sessions.ts` con el próximo ID (mayor ID + 1; verificar `grep -n '"id":' sessions.ts | tail`). Premium → `isPremium: true` (card muestra estrellita dorada; tap → `/membresia`)
4. **Actualizar `config/audio-map.ts`**: `AUDIO_MAP` (audio 1 siempre); audio 2 según categoría (tabla abajo); `LOOP_SESSIONS` si debe repetirse (IDs como strings: `"20"`)

### Reglas de audio por categoría

| Categoría | Timer en player | Audio 2 va en | Loop |
|---|---|---|---|
| Sonidos Ancestrales | ✅ sí | VOICE_MAP | No (duración fija) |
| Música y Sonidos → Sonidos Naturaleza | ✅ (modal timer previo) | `config/nature-base-map.ts` (base + ambient) | ✅ Sí (mixer) |
| Música y Sonidos → Ambient/Enteógena | ❌ (duración fija) | AMBIENT_MAP | ✅ Sí → LOOP_SESSIONS |
| Meditaciones Guiadas | ❌ | VOICE_MAP | No |
| ASMR / Historias / Podcast | ❌ | — | No |

> **Sonidos Naturaleza (modelo Pura Mente):** 2 sonidos fijos por sesión — `base` (fondo, sin barra de volumen) + `ambient` (capa precargada opcional, única barra regulable) en `config/nature-base-map.ts` (`{ base, ambient? }`). NO hay picker "+ Sonidos" en la inmersiva (para mezclas libres está "Mi Música"). Al subir, el usuario indica cuál es base y cuál ambiente; ambos deben existir en `data/sounds.ts`/`SOUND_MAP`. Al cerrar la inmersiva → `stopAll()`.

### Mapeo de campos a tipos

| Campo del formulario | Campo en Session |
|---|---|
| Categoria | `categoryId` + `categoryLabel` |
| Subcategoria | `ancestralTag` / `soundTag` / `meditationTag` / etc. |
| Grupo 1 / Grupo 2 | `themeTag: [...]` / `sleepTag` |
| Artista (solo Música Ambient/Enteógena) | `artistId` (de `data/artists.ts`; omitido → "resonancia") |
| Guiador (solo Meditaciones Guiadas) | `guideId` (de `data/guides.ts`; omitido → "casa-cuenco") |

> **NEVER** agregar sesiones fuera del array `SESSIONS = [...]` — siempre antes del `];` de cierre.

## Videos, Artistas, Guiadores (secciones dentro de Biblioteca)

- **Videos** (`data/videos.ts`, `components/VideoCard.tsx`, `app/video/[id].tsx`, `app/videos.tsx`): videos pregrabados con `expo-video`. NO se bundlean — viven en Object Storage, se sirven desde `GET /api/storage/objects/*` (soporta range → seek/streaming; `public-objects` NO sirve para video). Subir: presigned URL → guardar `objectPath`, thumbnail a `assets/images/videos/`, agregar a `VIDEOS`. **Gating premium = solo UI** (la ruta no exige ACL; enforcement real depende de RevenueCat). NO modificar esa ruta sin coordinar (la comparte el chat DM image/audio).
- **Artistas** (`data/artists.ts`, `components/ArtistCard.tsx`, `app/artista/[id].tsx`): perfiles curados (en código, NO usuarios) de productores. Carrusel si `featured`. `getArtist(id?)` con fallback (player) vs `getArtistById` sin fallback (perfil). Subir: foto a `assets/images/`, objeto en `ARTISTS` con `id` slug único, `artistId` en cada sesión Ambient/Enteógena. Default `"resonancia"`. Actuales (Lumen Sonora, Raíz Profunda) son placeholders.
- **Guiadores** (`data/guides.ts`, `components/GuideCard.tsx`, `app/guiador/[id].tsx`): espejo de Artistas para Meditaciones Guiadas. `guideId` por sesión; default `"casa-cuenco"`. Actuales (Sofía Ramírez, Mateo Luz) son placeholders.

## Panel de administración web (`resonancia-admin`, ruta `/admin/`)

Panel admin-only que reusa la misma DB/API. Auth = **Clerk cookie-based same-origin** (NO Bearer, NO `setBaseUrl`). Gating real solo en el server (`requireAuth + requireRole("admin")`); el front solo muestra/oculta UI. Funciones: dashboard de estadísticas globales, usuarios (listar/buscar/cambiar rol user/creator/admin), moderación (cola por estado + aprobar/rechazar/editar/ocultar/mostrar), categorías (crear/editar). Endpoints en `routes/admin.ts` + hide/unhide en `routes/catalog.ts`.

## User preferences

- **"RA"** = "Restart App" — reiniciar el workflow `artifacts/mobile: expo`
- Idioma: español neutro en toda la UI y en las respuestas del agente (no usar modismos argentinos)
- Colores (navy + dorado): bg `#0B0F14`, primary `#BE9650`, accent `#D6A85B`, card `#151A23`, fg `#EDE1D3`, mutedForeground `#7A8FA8`. (Migrada de café/bronce a navy en app y decks; decks no se vuelven a tocar.)
- Pre-existing TS errors (ignorar): VozInterior, MensajesAnon, MiniPlayer, session/[id], SessionCard, PlayerContext, player.tsx

## Pendientes (backlog)

- **Sync en la nube (actividad)**: armada (Fase 1) — eventos de reproducción, favoritos y progreso se sincronizan con cuenta Clerk; sin cuenta todo local (offline-first). `lib/cloudSync.ts`, `routes/activity.ts`. Reglas: eventos = unión append-only (dedup `clientEventId`); favoritos/progreso = unión solo en primer sync, luego local autoritativo. Limitación: sin tombstones/LWW, un borrado en otro dispositivo puede reaparecer (mejora futura: timestamps por ítem). Historial local-only.
- **Free vs Premium (gating)**: `PremiumContext` + `isPremium` por sesión armados (mobile-only, mover a `lib/` cuando exista web). Toggle de testing en Configuraciones → DESARROLLO. Falta: gating de features (no solo sesiones) + decidir qué sesiones marcar premium. Propuesta de paquete free/premium en `docs/premium-propuesta.md`.
- **Cobro Premium (in-app)**: RevenueCat sobre Apple IAP / Google Play (obligatorio en móvil; Apple/Google 15-30%). Web futura → Stripe directo. Free trial 7 días = se configura en stores, NO en código (RevenueCat lo lee, `isPremium` ya funciona). Precios localizados por región. Detalle/decisiones en `docs/premium-propuesta.md`.
- **Videos → Bunny.net Stream (futuro)**: usuario confirmó migrar a Bunny (50 videos 20-50 min) — ~10-20× más barato + CDN + token auth (gating real). Pasos completos en `COSTOS-Y-VIDEOS-BUNNY.md`. Pendiente hasta que el usuario lo decida.
- **EAS Build (publicar + push reales)**: código armado (`eas.json`, hook de push, registro de tokens). Faltan pasos manuales (cuenta expo.dev, `eas init`, credenciales APNs/FCM, reemplazar placeholders `REPLACE_WITH_…`, primer build). Costos: EAS Free (30 builds/mes) o USD 19/mes. Apple Developer USD 99/año, Google Play USD 25 único.
- **Backend pendiente (cuando exista)**: notificaciones push reales (campana + "Actividad de la comunidad" toggle); contador real "X compartieron" de Frase del día; promedio real de valoración en cards de Meditaciones Guiadas (hoy muestra la nota del propio usuario, local en `@resonance_ratings`); "Términos y privacidad" → link externo oficial.
- **Precarga audios Sonidos Naturaleza (a producción)**: precalentar SOLO los ~4 base al ENTRAR a "Música y Sonidos" (no al abrir la app) + el ambient de la sesión; loops ~20-30s MP3 128-160 kbps (convertir WAV con ffmpeg).
- **Versión web (futura)**: reusar DB/API/lógica, reescribir UI (RN no corre en web). Pago Stripe directo. ~2-4 semanas según scope.

## Pointers

- Estructura del monorepo, TypeScript y packages → skill `pnpm-workspace`
- Auth del panel admin → `.agents/memory/admin-web-auth.md`
</content>
</invoke>
