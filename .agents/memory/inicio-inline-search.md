---
name: Buscador de Inicio como Descubrir
description: Decisión vigente para que Inicio 3 comparta la barra, filtros y comportamiento de búsqueda de Descubrir.
---

Inicio 3 usa una barra completa en el flujo de la página, con el mismo template visual y el mismo `ContextSearchModal` de Descubrir. La lupa circular aislada del hero no debe regresar. Compartir el componente no implica compartir el fondo: las búsquedas principales de Descubrir, Dormir y Sonidos usan el tercer stop sólido; Inicio conserva el fondo previo.

**Why:** El usuario reemplazó explícitamente la dirección anterior de búsqueda inline por el patrón de Descubrir, incluyendo filtros incorporados en la superficie de búsqueda; después pidió el tercer stop únicamente para las otras tres páginas de búsqueda.

**How to apply:** Mantener la barra de 50 px con borde blanco, lupa y texto “Busca por título, categoría o autor”. Usar el scope de Descubrir para recientes, populares y duración, e indexar también el autor. No aplicar globalmente a Inicio los cambios de fondo pedidos solo para Descubrir, Dormir y Sonidos. Conservar intacto el parallax `scrollY * 0.42` del header de Inicio 3.
