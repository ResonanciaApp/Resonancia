---
name: Postulaciones (applications) feature
description: How Resonador/Expansor application forms reach the web admin panel, plus the non-interactive DB push gotcha
---

# Postulaciones (applications)

Full flow so mobile Resonador/Expansor application forms land in the web admin panel:
`applications` table → `POST /applications` (public) + `GET/PATCH /admin/applications` (admin) → admin page `/postulaciones`.

## Conditional validation lives in the route, not the schema
`CreateApplicationBody` (zod from OpenAPI) makes `audioPath`/`location` optional. The per-type
rules — `resonador` requires `audioPath`, `expansor` requires `location` — are enforced
imperatively in `routes/applications.ts` POST, mirrored by client-side Alerts in the forms.
**Why:** OpenAPI cannot express "required only when type==X"; keep both sides in sync.

## Admin audio playback URL mapping
Stored `audioPath` is an objectPath `/objects/uploads/<uuid>`. To play it in the admin panel,
map to the serving route by replacing the `/objects/` prefix: `/api/storage/objects/uploads/<uuid>`.
Same-origin cookie auth covers it.

## DB push is interactive — use push-force
`pnpm --filter @workspace/db run push` prompts interactively (hangs in automation).
Use `pnpm --filter @workspace/db run push-force` for non-interactive schema push in dev.
