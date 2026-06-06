---
name: voiceTag three-state caption contract
description: How the per-session voice caption (Guiada/Sin voz/empty) resolves across bundled vs DB sessions, and the hydration trap.
---

El caption de voz de las cards ("Guiada" / "Sin voz" / vacío) se resuelve con `getVoiceLabel(session)` y tiene **tres estados**:

- `voiceTag === undefined` → sesión bundleada: fallback legacy derivado de `VOICE_MAP` (`id in VOICE_MAP ? "Guiada" : "Sin voz"`).
- `voiceTag === null` → sesión de DB con etiqueta vacía explícita: caption oculto.
- `voiceTag === "Guiada" | "Sin voz"` → valor fijado por el admin.

**Why:** El admin pidió control total (elegir tag o dejar vacío). Antes era binario auto-derivado de VOICE_MAP. Mantener `undefined` distinto de `null` es lo que preserva el fallback legacy de las sesiones bundleadas que aún no tienen etiqueta.

**How to apply:** En `applyCatalogSnapshot` (`artifacts/mobile/data/sessions.ts`):
- Fase 1 (bundleadas, hidratación in-place): **solo** sobrescribir `local.voiceTag` cuando el remoto trae un valor NO nulo (`if (r.voiceTag != null) local.voiceTag = ...`). Si se asignara `r.voiceTag ?? null` se clobbea `undefined`→`null` y desaparecen captions legacy.
- Fase 2 (sesiones nuevas de DB, `SESSIONS.push`): ahí sí `r.voiceTag ?? null` es correcto (no tienen entrada en VOICE_MAP, vacío = sin caption).

**Limitación conocida:** la columna `voice_tag` (nullable text) NO distingue "sin fijar" de "vacío explícito". Para una sesión bundleada eso significa que el admin puede sobrescribir a "Guiada"/"Sin voz" pero NO puede forzar vacío (cae al fallback VOICE_MAP). Si se necesita, agregar un flag/modo separado en el transporte.

Capas que propagan `voiceTag`: DB schema `catalog-sessions.ts` → OpenAPI (CatalogSession, Submission, CreatorSubmissionInput, ReviewEditBody) → catalog.ts (serialize/insert/patch) → admin (sesiones.tsx create, moderacion.tsx edit) → mobile render (SessionRow, playlist/[id], carpeta/[id], index hero).
