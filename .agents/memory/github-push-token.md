---
name: GitHub push via GHPUSH_TOKEN
description: How to push to GitHub when the Replit git credential is broken for this workspace
---
El askpass del workspace (`replit-git-askpass`) devuelve password vacío aunque la conexión GitHub esté "Active" → `git push origin main` falla con "Invalid username or token". El connector (`listConnections("github")`) funciona para API pero NO expone token de git (proxy server-side, auth "unauthenticated").

**Solución vigente:** secreto `GHPUSH_TOKEN` (fine-grained PAT del org ResonanciaApp, repo Resonancia, Contents read/write, expira 13-sep-2026).

**How to apply:** `git push https://x-access-token:${GHPUSH_TOKEN}@github.com/ResonanciaApp/Resonancia.git main` con `| sed "s/${GHPUSH_TOKEN}/***/g"` para no filtrar el token en logs. No guardar el token en el remote URL de .git/config.

**Why:** los PAT fine-grained nacen con acceso "Public repositories" (read-only); hay que elegir "Only select repositories" + permiso Contents Read and write o el push da 403 aunque la API diga push:true.
