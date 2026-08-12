---
name: Agenda online block palette
description: Paleta púrpura deliberada del bloque de agendamiento en el perfil resonador (diverge del dorado de marca)
---

El bloque "Disponible para sesiones" del perfil resonador usa una paleta PÚRPURA deliberada, no el dorado de marca:
- Borde: `#8260B5` sólido; fondo del bloque: `rgba(0,0,0,0.15)`
- Chip "Agenda online": degradado horizontal `#8260B5 → #5B427F`, texto blanco
- Ícono calendario: `#F9F9F9` sobre círculo `rgba(255,255,255,0.04)`

**Why:** el usuario iteró ~8 paletas (dorados, corales, azules) y se quedó con púrpura para diferenciar el agendamiento del resto del perfil.

**How to apply:** no "corregir" esto a dorado en pasadas de consistencia. La pantalla `resonador-servicio/[id].tsx` sigue en dorado — el usuario aún no pidió unificarla.
