---
name: Bajas remotas del catálogo
description: Regla para que sesiones eliminadas o despublicadas no reaparezcan desde snapshots móviles obsoletos.
---

Solo un snapshot fresco y válido del catálogo es autoritativo para las sesiones y sonidos agregados dinámicamente: cualquier entrada no bundleada que ya no venga del servidor debe retirarse del array móvil.

**Why:** borrar una sesión de la BD y del bundle no bastó; un snapshot antiguo en AsyncStorage volvió a insertarla y el merge anterior solo agregaba o actualizaba, nunca eliminaba.

**How to apply:** cuando cambie la semántica del snapshot, invalidar su cache persistido. Conservar siempre las sesiones bundleadas como fallback offline y la última respuesta remota válida ante errores HTTP/red; podar entradas remotas ausentes solo después de recibir una respuesta válida.

Una eliminación definitiva solicitada para una sesión incluida de fábrica también debe retirar su respaldo offline y su semilla, y rechazar su reaparición desde cachés anteriores. No borrar archivos de audio físicos compartidos con otras sesiones.

**Why:** Una sesión puede estar en Borrador en el servidor y aun así aparecer en la app por su copia incluida. Borrar solo el registro no elimina ese respaldo, y una semilla o un snapshot antiguo pueden restaurarla.

**How to apply:** Limitar la retirada al ID autorizado y comprobar sus referencias editoriales y de audio. No convertir esta excepción en una poda general de todas las sesiones bundleadas ausentes del servidor: el respaldo offline de las demás sigue siendo deliberado.