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
- `artifacts/mobile/data/artists.ts` — tipo Artist, array ARTISTS, helpers getArtist/getArtistSessions/getArtistTrackCount/getFeaturedArtists
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
Premium:      ← "sí" / "no" (default no = free)
Nombre Audio 1:
Nombre Audio 2:  ← dejar vacío si no aplica
```

> Si la sesión es premium, agregar `isPremium: true` al objeto en `sessions.ts`. Las cards muestran una estrellita dorada arriba a la derecha cuando el usuario no es premium, y el tap redirige a `/membresia`.

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
| Artista (solo Música Ambient/Enteógena) | `artistId` (ID de `data/artists.ts`; si se omite → "resonancia") |

## Videos (sección dentro de Biblioteca)

Sección de videos pregrabados que aparece como bloque "Videos" en `app/(tabs)/explore.tsx` (solo se muestra si hay videos cargados). Archivos:

- `artifacts/mobile/data/videos.ts` — tipo `VideoItem`, array `VIDEOS`, helper `getVideoSourceUri` (mapea `objectPath` "/objects/..." → ruta de serving `/api/storage/objects/...` usando `EXPO_PUBLIC_API_URL`)
- `artifacts/mobile/components/VideoCard.tsx` — card (carousel + horizontal) con gating premium y overlay de play
- `artifacts/mobile/app/video/[id].tsx` — reproductor con `expo-video` (`useVideoPlayer` + `VideoView`); si es premium y el usuario no, redirige a `/membresia`
- `artifacts/mobile/app/videos.tsx` — listado completo con empty state "Próximamente"

Los videos NO se bundlean (pesan demasiado): viven en Object Storage y se sirven desde `GET /api/storage/objects/*` (esa ruta soporta range requests → seek y streaming progresivo). `public-objects` NO sirve para video (sin range).

### Subir un video

1. Subir el archivo a Object Storage (presigned URL flow) → guardar el `objectPath` devuelto ("/objects/...").
2. Copiar el thumbnail a `artifacts/mobile/assets/images/videos/` (o reutilizar un placeholder).
3. Agregar el objeto a `VIDEOS` en `data/videos.ts` con el próximo ID. Marcar `isPremium: true` si corresponde.

> **Gating premium de videos = solo UI** (igual que las sesiones). La ruta `/api/storage/objects/*` no exige auth/ACL, así que un usuario podría pedir la URL directa. El enforcement real depende de tener el estado premium en backend (RevenueCat, ver pendientes). NO modificar esa ruta para gating sin coordinar: la comparte el chat (DM image/audio).

## Artistas (sección dentro de Biblioteca)

Perfiles curados (en código, NO usuarios reales) de productores certificados que crean música para la app. Aparecen como carrusel "Artistas" al final de `app/(tabs)/explore.tsx` (solo si hay artistas `featured`). Visibles para free y premium. Archivos:

- `artifacts/mobile/data/artists.ts` — tipo `Artist` (id, name, photo, bio, country, genre, links[], certified, featured), array `ARTISTS`, `DEFAULT_ARTIST_ID = "resonancia"`, helpers `getArtist(id?)`, `getArtistSessions(id)`, `getArtistTrackCount(id)`, `getFeaturedArtists()`
- `artifacts/mobile/components/ArtistCard.tsx` — card circular del carrusel (foto + nombre + sello certificado)
- `artifacts/mobile/app/artista/[id].tsx` — perfil: foto, nombre + sello, país, género, bio, redes, contador de pistas y listado de sus sesiones (tap → `playSession` + `/player`; gating premium por sesión)

Cada sesión de **Música Ambient / Música Enteógena** lleva crédito de artista, que se muestra en el player (línea tappable "por [Artista]" debajo del subtítulo) y enlaza al perfil.

### Subir un artista

1. Copiar la foto a `artifacts/mobile/assets/images/` (recomendado: cuadrada, se recorta circular).
2. Agregar el objeto a `ARTISTS` en `data/artists.ts` con un `id` único (slug), `featured: true` para que salga en el carrusel, `certified: true` para el sello.
3. En cada sesión Música Ambient/Enteógena de ese artista, poner `artistId: "<su-id>"` en `sessions.ts`. Si se omite → queda atribuida a "resonancia" (la casa).

> Los artistas actuales **Lumen Sonora** y **Raíz Profunda** son ejemplos con fotos placeholder — reemplazar con artistas reales. El artista por defecto es **"Resonancia"** (cambiar `name` cuando se defina el nombre final de la app).

## Guiadores (voces guía de Meditaciones Guiadas)

Espejo del patrón Artistas, pero para Meditaciones Guiadas. Perfiles curados (en código, NO usuarios reales) de voces guía: foto, bio, país, especialidad, redes, certificado. Aparecen como carrusel "Guiadores" en Biblioteca (debajo de Artistas) y en la pantalla de categoría Meditaciones Guiadas. En cada sesión guiada, el bloque "Sobre la voz guía" muestra foto/nombre/país tappable al perfil. Archivos:

- `artifacts/mobile/data/guides.ts` — tipo `Guide` (id, name, photo, bio, country, specialty, links[], certified, featured), array `GUIDES`, `DEFAULT_GUIDE_ID = "casa-cuenco"`, helpers `getGuide(id?)`, `getGuideById(id)`, `getGuideSessions(id)` (solo meditaciones-guiadas), `getGuideTrackCount(id)`, `getFeaturedGuides()`
- `artifacts/mobile/components/GuideCard.tsx` — card circular del carrusel (foto + nombre + sello certificado + specialty) → `/guiador/[id]`
- `artifacts/mobile/app/guiador/[id].tsx` — perfil: foto, nombre + sello, país, especialidad, bio, redes, contador de meditaciones y listado de sus sesiones (estado "no encontrado" incluido)

Cada sesión de **Meditaciones Guiadas** lleva `guideId` (campo en `sessions.ts`). Si se omite → guiador por defecto **"Casa del Cuenco"** (la casa). El antiguo tipo `SessionGuide` / campo `guide` fue eliminado.

### Subir un guiador

1. Copiar la foto a `artifacts/mobile/assets/images/` (recomendado: cuadrada, se recorta circular).
2. Agregar el objeto a `GUIDES` en `data/guides.ts` con un `id` único (slug), `featured: true` para el carrusel, `certified: true` para el sello.
3. En cada sesión Meditación Guiada de ese guiador, poner `guideId: "<su-id>"` en `sessions.ts`. Si se omite → queda atribuida a "casa-cuenco".

> Los guiadores actuales **Sofía Ramírez** y **Mateo Luz** son ejemplos con fotos placeholder — reemplazar con voces reales. El guiador por defecto es **"Casa del Cuenco"**.

## User preferences

- **"RA"** = "Restart App" — cuando el usuario escribe "RA", reiniciar el workflow `artifacts/mobile: expo`
- Idioma: español neutro en toda la UI y en las respuestas del agente (no usar modismos argentinos)
- Colores: bg `#18110C`, primary `#C69B4F`, accent `#D6A85B`, card `#24160F`, fg `#EDE1D3`
- Pre-existing TS errors (ignorar): VozInterior, MensajesAnon, MiniPlayer, session/[id], SessionCard, PlayerContext, player.tsx

## Gotchas

- El próximo ID de sesión disponible es el número más alto en `sessions.ts` + 1. Verificar con `grep -n '"id":' sessions.ts | tail -10`
- Si no se adjunta imagen, reutilizar `session-2.png` como placeholder y notificarlo
- NEVER agregar sesiones fuera del array `SESSIONS = [...]` — siempre antes del `];` de cierre
- LOOP_SESSIONS usa IDs como strings: `"20"`, no `20`

## Pendientes (recordar más adelante)

- **Configuraciones → "Actividad de la comunidad"**: hoy solo guarda la preferencia local. Cuando exista backend de notificaciones, enchufar push real (suscribir/desuscribir según toggle).
- **Notificaciones (campana)**: hoy abre un Alert "Próximamente". Cuando exista backend, restaurar `useGetUnreadNotificationCount` + ruta `/notificaciones` con badge de no leídas.
- **Configuraciones → "Términos y privacidad"**: hoy apunta a `/terminos` con texto base interno. Cuando exista web oficial, opcionalmente reemplazar por link externo.
- **Configuraciones → "Calificar la app"**: ya usa `expo-store-review` (`requestReview` → fallback a `storeUrl` → fallback a Alert). Funciona automáticamente cuando esté publicada en stores.
- **Free vs Premium (gating de funcionalidades)**: `PremiumContext` + flag `isPremium` por sesión ya armados (mobile-only, pendiente mover a `lib/` cuando exista la web). Toggle de testing en Configuraciones → DESARROLLO (`__DEV__`). Falta: gating de features (no solo sesiones), y decidir qué sesiones marcar como premium al subirlas.
- **Precarga de audios base de "Sonidos Naturaleza" (al salir a producción)**: hoy el arranque del loop ya es rápido (seek a `dur/2` + fade-in, ver `MixerContext.createPlayerFor`), pero queda la decodificación del archivo la primera vez. Cuando el usuario mande los audios finales: (1) **precalentar SOLO los ~4 sonidos base** (`config/nature-base-map.ts`: bosque, lluvia, océano, río) al ENTRAR a la pantalla "Música y Sonidos" (NO al abrir la app — cargar el catálogo completo de 30+ sonidos haría la app pesada de iniciar sin beneficio real). Así al tocar la card el sonido arranca casi instantáneo. (2) **Optimizar peso**: loops de ~20-30s en MP3 ~128-160 kbps (el tiempo de carga depende del peso). Si llegan en WAV, convertir con ffmpeg. (3) Los ambientes secundarios ("+ Sonidos") pueden seguir cargando bajo demanda (ahí una pequeña espera es aceptable porque ya suena el fondo).
- **Videos → migrar a Bunny.net Stream (más adelante)**: el usuario confirmó que quiere usar **Bunny.net** para servir los videos (50 videos de 20-50 min). Hoy los videos se sirven desde Object Storage (`/api/storage/objects/*`), que es caro en ancho de banda a escala. Bunny es ~10-20× más barato por GB + CDN + compresión automática + Token Authentication (gating premium real). Detalle completo y pasos en `COSTOS-Y-VIDEOS-BUNNY.md` (raíz del proyecto). Resumen: (1) usuario crea cuenta + Video Library en bunny.net y pasa Library ID + Pull Zone + API Key; (2) agente guarda credenciales como secrets, cambia `VideoItem` para usar `bunnyVideoId` (GUID), reapunta `getVideoSourceUri` a la URL HLS de Bunny, y agrega firmado de URLs premium en el server. Pendiente hasta que el usuario lo decida.

### Propuesta de paquete Premium (a revisar y definir)

**FREE incluye:**
- Sesiones marcadas como gratuitas (hoy: #1 "Adentro de uno mismo" y #29 "Prueba Maestra 1") — pensar 5-8 sesiones sampler en total, repartidas entre categorías
- Intención del día (ilimitada)
- Frase del día (ver + compartir)
- Diario: hasta **5 entradas** guardadas
- Favoritos: hasta **5 sesiones** favoritas
- Timer de sueño / meditación: hasta **30 min**
- Comunidad: acceso completo (grupos, posts, actividades, chat, invitar, crear)
- Configuraciones, perfil, ayuda, registro
- Notificaciones (cuando exista backend)

**PREMIUM desbloquea:**
- Catálogo completo de sesiones
- **Voz Interior**: grabar mensajes (hoy todos pueden)
- **Diario / Mensajes del Alma**: entradas ilimitadas
- **Favoritos**: ilimitados
- **Timer**: hasta 8 hs (para dormir toda la noche)
- **Descargas offline** de sesiones
- **Mensajes anónimos**: enviar (no solo leer)
- **Estadísticas / historial extendido** (más allá de últimos 7 días)
- **Personalización avanzada**: temas, sonidos ambiente custom

**Comunidad queda 100% FREE** (grupos, actividades, chat, invitar amigos, postear).

**Notas de implementación cuando se confirme:**
- Cada feature gateada usa `const { isPremium } = usePremium()` y muestra PremiumBadge / Alert → router.push("/membresia")
- Mantener UX coherente: el free ve la opción pero al tocar le explica brevemente y le ofrece probar premium
- Para los límites (5 diario, 30 min timer, etc.), guardar el contador local y al alcanzar el tope mostrar paywall

- **Versión web (futura)**: la DB, API y lógica se reusan. Hay que reescribir UI (RN no corre en web). Pago: Stripe directo (no Apple/Google). Estimado: 2-4 semanas de trabajo dependiendo del scope.
- **Cobro de Premium (pagos in-app)**: usar **RevenueCat** sobre Apple IAP / Google Play Billing (obligatorio para apps móviles — no se puede usar Stripe directo). Apple/Google se quedan 15-30%. Falta: definir precio (mensual/anual/lifetime), crear cuentas en App Store Connect + Google Play Console + RevenueCat. Para web (si llega) sí va Stripe directo.
- **Prueba gratis de 7 días (free trial)**: estándar en la categoría (Calm, Headspace, Pura Mente). NO se programa en código — se configura como "oferta introductoria" en App Store Connect y Google Play Console, atada al producto de suscripción. RevenueCat la lee automáticamente y `isPremium` ya funciona durante el trial. Decisiones a tomar al implementar:
  - Duración: 7 días (estándar) vs 14 (más conversión, más abuso)
  - Solo en plan anual (recomendado, empuja al anual) vs también en mensual
  - Pedir tarjeta upfront (default Apple/Google, mejor conversión post-trial) vs sin tarjeta
  - Precio sugerido: ~$43.900/año (similar a Pura Mente) + opción mensual ~$4.900/mes — ajustar según mercado destino
- **Disponibilidad por país + precios por región**: la app se puede vender en +150 países (todos los hispanohablantes incluidos). Al publicar se elige en qué países está disponible (default: todos, o solo Latam+España al inicio). Apple/Google cobran en moneda local automáticamente y retienen impuestos por país. Recomendación de estrategia de precios regional:
  - **Localizar precios por región** (NO usar un precio global convertido): el poder adquisitivo varía mucho. Un precio que funciona en España (~€40/año) es caro para Latam.
  - Sugerencia de tiers: España/EE.UU. ≈ €40-45/año; México/Chile/Colombia/Perú/Argentina ≈ equivalente a USD 15-25/año; ajustar por país con los precios que recomienda RevenueCat/App Store Connect (tienen sugerencias por paridad de compra).
  - RevenueCat permite definir precios por país/región desde su panel sin tocar código — `isPremium` funciona igual sin importar el precio pagado.
  - Plan anual como ancla (mejor retención) + mensual más caro proporcionalmente para empujar al anual.
  - Al lanzar, arrancar con precios un poco más bajos (oferta de lanzamiento) para ganar reseñas y conversión, luego subir.
- **Frase del día → contador "X compartieron"**: el número actual es decorativo (fórmula basada en el día del año, no en datos reales). Cuando exista backend, registrar cada compartida en DB y devolver el total real desde la API.
- **Valoración en cards de Meditaciones Guiadas (promedio real)**: hoy las cards de las subcategorías muestran la valoración del **propio usuario** (guardada local en `@resonance_ratings`, mapa `{sessionId: estrellas}`); si no la valoró, no muestra nada. Cuando exista backend, registrar cada valoración en DB y mostrar el **promedio de la comunidad** (ej. 4.5/5) en lugar de la nota individual.
- **EAS Build (publicar la app + activar push notifications reales)**: el código ya está armado (`eas.json` con perfiles dev/preview/production, hook de push, registro/unregistro de tokens, server enganchado a DM/amigos). Faltan los pasos manuales:
  1. Crear cuenta gratis en https://expo.dev
  2. `npm install -g eas-cli` + `eas login`
  3. Desde `artifacts/mobile/`: `eas init` (genera `projectId` y lo agrega a `app.json` — lo necesita el hook de push para pedir el token)
  4. Credenciales de push: iOS → `eas credentials` con APNs key (requiere cuenta Apple Developer USD 99/año); Android → subir `google-services.json` de Firebase para FCM
  5. Reemplazar placeholders `REPLACE_WITH_…` en `eas.json` (submit.production) con Apple ID, ascAppId, teamId, y poner el service account de Google Play (USD 25 pago único)
  6. Primer build: `eas build --profile preview --platform all`
  - Costos: EAS Free tier (30 builds/mes) o Production (USD 19/mes). Cuando se decida avanzar, pedirle al agente que ayude con credenciales y primer build.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
