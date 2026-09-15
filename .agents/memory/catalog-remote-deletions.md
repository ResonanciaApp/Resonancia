---
name: Bajas remotas del catálogo
description: Regla para que sesiones eliminadas o despublicadas no reaparezcan desde snapshots móviles obsoletos.
---

Solo un snapshot fresco y válido del catálogo es autoritativo para las sesiones y sonidos agregados dinámicamente: cualquier entrada no bundleada que ya no venga del servidor debe retirarse del array móvil.

**Why:** borrar una sesión de la BD y del bundle no bastó; un snapshot antiguo en AsyncStorage volvió a insertarla y el merge anterior solo agregaba o actualizaba, nunca eliminaba.

**How to apply:** cuando cambie la semántica del snapshot, invalidar su cache persistido. Conservar siempre las sesiones bundleadas como fallback offline y la última respuesta remota válida ante errores HTTP/red; podar entradas remotas ausentes solo después de recibir una respuesta válida.