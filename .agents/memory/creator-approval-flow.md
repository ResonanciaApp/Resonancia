---
name: Creator approval flow
description: How creator-uploaded content moves from submission to published catalog, and who can do what
---

# Flujo de creador / aprobación (catálogo en DB)

Contenido del catálogo (`catalog_sessions`) tiene `status`: draft → pending →
published / rejected. Creadores suben → `pending`; admin aprueba → `published`
(lo sirve `GET /catalog`) o rechaza → `rejected` + `rejectionReason`.

## Roles
- **Rol vive en `users.role`** (`creator` | `admin` | usuario normal). Gating
  real = `requireAuth` + `requireRole(...)` en el server; el cliente solo
  oculta UI.
- **Admin NO se auto-asigna**: `requireAuth` promueve a admin solo si el
  Clerk userId está en el secret `ADMIN_CLERK_USER_IDS` (coma-separado).
- **No existe (todavía) forma de nombrar creadores desde la app** — hay que
  setear `users.role='creator'` a mano en DB. Es un gap conocido (follow-up).

## Validación de assets (server no ve los bytes)
El server valida METADATA, no contenido: `objectPath` debe empezar con
`/objects/`, `contentType` audio/* (audios) e image/* (portada, **obligatorio
si hay `imageObjectPath`**), límites 200MB/15MB. Sesión + audios se insertan en
una transacción (`db.transaction`) para no dejar sesiones huérfanas.

**Why:** el requisito es "validar SIEMPRE en server" — un cliente podría mandar
un objectPath con contentType ausente; por eso la portada exige image/* cuando
está presente, no solo "si viene el campo".

## Hooks generados (Orval) — gotcha
El tipo `query` de los hooks generados exige `queryKey` (react-query v5). Para
gatear con `enabled` hay que pasar también la query key:
`useGetMySubmissions({ query: { enabled, queryKey: getGetMySubmissionsQueryKey() } })`.
Hooks con params (ej. `useGetPendingSubmissions(params, { query })`) reciben los
params como **primer** argumento (pasar `undefined` si no hay filtro).
