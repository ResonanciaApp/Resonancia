---
name: Tab bar hide on Geometrix
description: Por qué el menú inferior se esconde en Geometrix y debe tener una pestañita para recuperarlo
---

En Geometrix el menú inferior se esconde al entrar (más espacio para el lienzo) y
reaparece con una "pestañita" (handle) sutil al fondo.

**Why:** el menú inferior es la ÚNICA navegación entre secciones principales
(Inicio/Explora/etc.); Geometrix solo apila sub-rutas. Esconderlo sin un modo de
recuperarlo deja al usuario atrapado. El usuario eligió una pestañita sutil que
al presionarla devuelve el menú a su estado original.

**How to apply:** la visibilidad es estado compartido en un contexto (provisto
sobre la tab bar y las pantallas; la tab bar custom se pasa por el prop `tabBar`,
así que el provider debe envolver el layout interno, no solo las pantallas). Si
una pantalla esconde el menú, debe pedir esconder en focus y restaurar en blur, y
derivar TODOS sus offsets inferiores (lienzo, thumbs, backdrops, mini player) del
estado `hidden` —si no, el contenido no aprovecha el espacio liberado o queda
flotando sobre el hueco.
