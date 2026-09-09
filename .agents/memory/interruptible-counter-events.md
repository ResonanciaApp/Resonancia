---
name: Contadores animados interrumpibles
description: Regla de ciclo de vida para contadores en cola que pueden quedar ocultos durante su animación.
---

Un evento visual en cola debe distinguir entre “iniciado” y “confirmado”. Si la superficie se oculta antes de completar la transición que comunica el nuevo valor, el evento permanece pendiente y puede reiniciarse al volver. Si se oculta después de comunicarlo, se retira de la cola para no repetirlo.

**Why:** Tratar todo evento iniciado como consumido pierde incrementos cuando la navegación interrumpe la entrada; conservar siempre el evento reproduce incrementos que el usuario ya vio.

**How to apply:** Usar esta separación en banners, toasts o contadores animados que viven junto a navegación, overlays o paneles capaces de ocultarlos durante una secuencia.