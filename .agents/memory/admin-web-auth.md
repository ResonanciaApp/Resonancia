---
name: Admin web panel auth
description: How the resonancia-admin web panel authenticates and gates admin access against the shared API
---

# Admin web panel (resonancia-admin) auth model

The web admin artifact reuses the same DB/API as the mobile app, but auth works differently from mobile.

- **Web uses Clerk cookie-based, same-origin auth.** Generated API client calls hit `/api/...` (relative), so the browser sends Clerk cookies automatically. Do NOT use `setBaseUrl`, `setAuthTokenGetter`, or Bearer tokens in the web admin — that is mobile's pattern, not web's.
- **Real authorization is server-side only.** Admin endpoints use `requireAuth + requireRole("admin")`. The frontend `AdminGate` (via `useGetMe`, `role !== "admin"` → AccessDenied) is UX only, never the security boundary.

**Why:** Mixing the mobile Bearer pattern into the web app breaks same-origin cookie auth and creates a false sense of client-side security. The server is authoritative.

**How to apply:** When adding admin features, gate the new route on the server with `requireRole("admin")` first; the web UI just shows/hides. The role-update contract enum (`UserRoleUpdate` in `lib/api-spec/openapi.yaml`) includes `admin` so admins can promote/demote admins — backend sets role generically, so only the enum gates allowed values.
