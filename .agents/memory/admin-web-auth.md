---
name: Admin web panel auth
description: How the resonancia-admin web panel authenticates and gates admin access against the shared API
---

# Admin web panel (resonancia-admin) auth model

The web admin artifact reuses the same DB/API as the mobile app.

- **Web admin uses Clerk Bearer tokens, NOT cookies.** `ClerkTokenSync` in `App.tsx` calls `setAuthTokenGetter(() => getToken())`, so the generated API client (Orval hooks) attaches `Authorization: Bearer <token>` automatically. Cookies alone do NOT authenticate against the API — `credentials: "include"` without the Bearer header returns 401.
- **Any raw `fetch` in the admin panel must attach the token manually**: `const { getToken } = useAuth()`, then `headers: { Authorization: \`Bearer ${await getToken()}\` }`. Pattern helper `authHeaders(token)` exists in `pages/escenas.tsx`, `pages/geometrix.tsx`, and `components/TagOptionSelector.tsx`.
- **Real authorization is server-side only.** Admin endpoints use `requireAuth + requireRole("admin")`. The frontend `AdminGate` (via `useGetMe`, `role !== "admin"` → AccessDenied) is UX only, never the security boundary.

**Why:** A raw fetch with only `credentials: "include"` fails with 401 even while Orval-based requests on the same page succeed — this asymmetric failure (some admin endpoints 200, others 401) is the signature of a missing Bearer header, not an expired session.

**How to apply:** When adding admin features, prefer the generated Orval hooks (token handled automatically). If a raw fetch is unavoidable, always use `useAuth().getToken()` + Authorization header. Gate the new route on the server with `requireRole("admin")` first; the web UI just shows/hides.

**Debugging note:** 401 on a *specific* admin route while others work can also mean a stale esbuild bundle missing the route (grep `dist/index.mjs`, restart the API workflow to rebuild) — check both.
