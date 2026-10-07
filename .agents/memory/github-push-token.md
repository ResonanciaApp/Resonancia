---
name: GitHub push via GHPUSH_TOKEN
description: Autenticación segura de Git al fallar la credencial habitual del workspace.
---
Si la autenticación habitual de Git falla, usar el secreto existente GHPUSH_TOKEN mediante un credential helper efímero, sin insertar su valor en URLs, argumentos de procesos, logs ni configuración persistente.

**Why:** La conexión de GitHub para API no garantiza que el askpass del workspace autentique operaciones Git. Colocar un token en una URL puede exponerlo antes de que un filtro de salida lo oculte.

**How to apply:** Primero intentar la autenticación habitual. Si falla, reemplazar los helpers solo para el comando mediante opciones temporales de Git; el helper entrega la credencial desde el entorno directamente a Git, sin mostrarla al agente. Conservar el remote limpio, no usar force-push y no omitir los uploads LFS. Un PAT fine-grained debe autorizar el repositorio y tener Contents read/write; no asumir vigencia ni permisos por una nota antigua.
