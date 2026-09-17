---
name: Reinicio duplicado de Expo
description: Qué hacer cuando el workflow móvil reinicia pero el Metro anterior conserva el puerto.
---

Un reinicio del workflow de Expo puede dejar vivo el grupo de procesos anterior mientras el nuevo CLI queda esperando la pregunta para usar otro puerto.

**Why:** El workflow puede aparecer como activo aunque el nuevo proceso no esté sirviendo; un segundo reinicio sin diagnóstico solo agrega otro proceso y mantiene el puerto ocupado.

**How to apply:** Si el log muestra “Port ... is running this app in another window”, inspeccionar los grupos de proceso de `pnpm`/Expo y el listener del puerto. Terminar únicamente el grupo anterior huérfano y después reiniciar una sola vez el workflow gestionado; confirmar que queda un solo Metro escuchando en el puerto inyectado.