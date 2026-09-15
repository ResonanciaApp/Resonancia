---
name: Carpetas de contenido exclusivo
description: Regla de producto para impedir que una carpeta general combine playlists y mezclas.
---

Una carpeta general puede contener playlists o mezclas, pero nunca ambos tipos al mismo tiempo. El primer tipo agregado determina qué acepta mientras conserve contenido; al retirar el último elemento de ese tipo, la carpeta vuelve a quedar libre.

**Why:** El usuario pidió que las carpetas mantengan una identidad clara y que cualquier intento de mezclar tipos muestre un aviso explícito. Las carpetas antiguas mixtas conservan el tipo cuyo contenido más reciente tenga el `createdAt` posterior; en empate se conservan playlists.

**How to apply:** Toda mutación debe proteger la regla en el estado central, además de avisar en la interfaz. No ocultar carpetas incompatibles de los selectores: mostrarlas bloqueadas y explicar por qué no aceptan el elemento.