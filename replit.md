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

## User preferences

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
- **Frase del día → contador "X compartieron"**: el número actual es decorativo (fórmula basada en el día del año, no en datos reales). Cuando exista backend, registrar cada compartida en DB y devolver el total real desde la API.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
