---
name: Clerk native SSO redirect allowlist
description: Google/Apple SSO en Expo Android "se queda pensando" o vuelve sin sesión — causas y fixes
---

Síntomas: startSSOFlow abre el navegador, Google termina bien, pero la app queda sin sesión (`signIn.status: "needs_identifier"`, createdSessionId null) aunque Clerk sí registra last_sign_in_at del usuario.

Causas encadenadas encontradas (ago 2026):
1. `makeRedirectUri({ scheme })` debe usar el scheme REAL de app.json (`resonancia`), no el nombre del artifact (`mobile`). El warning "Linking scheme 'X' does not appear…" en Metro delata esto.
2. La allowlist de redirect URLs del tenant Clerk gestionado estaba VACÍA: Clerk completa el login en el navegador pero no redirige de vuelta. Fix por Backend API: `POST https://api.clerk.com/v1/redirect_urls {"url":"resonancia://sso-callback"}` con CLERK_SECRET_KEY (listar con GET para verificar).
3. En Android conviene redirect con RUTA explícita (`resonancia://sso-callback`), el bare `scheme://` puede no ser capturado por openAuthSessionAsync.

**How to apply:** cualquier flujo OAuth nativo nuevo → verificar scheme + allowlist por API antes de debuggear el cliente. Diagnóstico rápido: log post-flow de {createdSessionId, signIn.status, signUp.status} + `GET /v1/users` para ver si Clerk sí creó el sign-in.
