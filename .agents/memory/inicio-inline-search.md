---
name: Buscador de Inicio como Descubrir
description: Decisión vigente para que Inicio 3 comparta la barra, filtros y comportamiento de búsqueda de Descubrir.
---

Inicio 3 usa una barra completa en el flujo de la página, con el mismo template visual y el mismo `ContextSearchModal` de Descubrir. La lupa circular aislada del hero no debe regresar.

**Why:** El usuario reemplazó explícitamente la dirección anterior de búsqueda inline por el patrón de Descubrir, incluyendo filtros incorporados en la superficie de búsqueda.

**How to apply:** Mantener la barra de 50 px con borde blanco, lupa y texto “Busca por título, categoría o autor”. Usar el scope de Descubrir para recientes, populares y duración, e indexar también el autor. Conservar intacto el parallax `scrollY * 0.42` del header de Inicio 3.
