---
name: Motor de hitos (logros)
description: Cómo funciona el sistema de hitos/celebraciones y sus reglas de sync y contadores
---

# Motor de hitos

- Definiciones (12 hitos, umbrales como datos) en `data/milestones.ts`; motor en `context/MilestonesContext.tsx`; celebración única global `components/MilestoneCelebration.tsx` montada dentro del provider en `_layout` (dentro de MixerProvider).
- **Regla de racha (desde ago 2026): día activo = ≥3 min escuchados O ≥1 sesión con `completed:true`** (antes: 5 min). Todo vive en `utils/stats.ts` (aggByDay). `computeTotalActiveDays` = días activos no consecutivos (hito 50 días).
- **Orden crítico**: la evaluación de hitos espera `hydrated && cloudSettled`. El merge nube va gateado por `isSignedIn` de Clerk (igual que PlayerContext) — cuando flipa a true, el token getter de ApiAuthBridge ya está instalado. Sin este orden, un dispositivo nuevo re-celebra y re-fecha hitos que ya existían en la cuenta.
- **Sync nube = unión append-only** (como eventos de plays): `syncMilestones` en `lib/cloudSync.ts`, PUT /me/milestones con onConflictDoNothing por (userId, milestoneId). Un hito nunca se "des-consigue".
- **Contadores de por vida** (`@resonance_creation_counters`): hitos de mezclas/Geometrix cuentan creaciones acumuladas, no ítems guardados. Patrón {lifetime, lastSeen}: si el conteo actual sube, la diferencia suma; borrar no resta.
- Conteo Geometrix cross-instancia: `subscribeGeometrixCount`/`readGeometrixCount` en `useGeometrixCreations` (las instancias del hook no comparten estado).
- Si varios niveles de una familia se cumplen a la vez (backfill de usuario antiguo), se celebra solo el más alto; los demás se registran en silencio.
- **Why:** evita flood de modales al primer arranque y fechas falsas en logros históricos.
- Orval: regenerar SIEMPRE con `npx -y orval@8.9.1` (el instalado 8.23 emite API de zod v4 — `zod.int()` — incompatible con zod 3 del workspace).
