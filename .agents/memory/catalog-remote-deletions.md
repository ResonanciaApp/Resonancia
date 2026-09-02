---
name: Bajas remotas del catálogo
description: Regla para que sesiones eliminadas o despublicadas no reaparezcan desde snapshots móviles obsoletos.
---

Un snapshot fresco del catálogo es autoritativo para las sesiones agregadas dinámicamente: cualquier sesión no bundleada que ya no venga del servidor debe retirarse del array móvil.

**Why:** borrar una sesión de la BD y del bundle no bastó; un snapshot antiguo en AsyncStorage volvió a insertarla y el merge anterior solo agregaba o actualizaba, nunca eliminaba.

**How to apply:** cuando cambie la semántica del snapshot, invalidar su cache persistido. Conservar siempre las sesiones bundleadas como fallback offline, pero podar las sesiones remotas ausentes del último snapshot válido.