---
name: Geometrix undo (Atrás) history
description: Cómo funciona el historial de deshacer del lienzo de Geometrix y por qué restaurar por setState revierte gestos
---

# Geometrix "Atrás" (deshacer)

Una composición = `{ active, settings, master, hiddenIds }`. El historial es una
pila de snapshots inmutables; "Atrás" restaura el tope con setState.

**Por qué restaurar settings via setState revierte transforms de gesto
(rotación/zoom/pan):** las capas derivan sus transforms de los PROPS de
`settings` en reposo; los shared values "live" (liveAngle/liveZoom/offset) solo
ganan mientras el gesto está activo (rotActiveSV/pinchActiveSV===1). Los effects
de sync re-siembran los SV desde los escalares de settings. Ver
`geometrix-rotation-sync-effect.md` y `geometrix-zoom-vector.md`.

**Captura con debounce (agrupar ráfagas en un paso):** un arrastre de slider o un
gesto dispara muchos setState seguidos. El efecto que vigila
`[active,settings,master,hiddenIds]` recuerda el estado PREVIO al primer cambio
de la ráfaga (`burstBaseRef`) y lo empuja a la pila solo cuando se asienta
(timer ~350ms). `undo()` primero confirma una ráfaga pendiente (push base +
clear timer) y luego hace pop → así deshace también un cambio en curso como UN
solo paso.

**`isUndoingRef`** marca que el próximo cambio viene del propio undo para no
re-grabarlo; el efecto lo limpia en su primera corrida tras restaurar.

**Reglas que evitan bugs sutiles:**
- El cleanup que recorta `hiddenIds` (al quitar capas) DEBE devolver la MISMA
  referencia cuando nada cambió, o cada render dispara un paso de historial
  espurio (la pila vigila `hiddenIds`).
- `resetHistory()` se llama al cargar otra creación y al empezar "nueva", pero
  **NO** en `clearCanvas` — limpiar el lienzo debe poder deshacerse.
- El efecto de captura tiene cleanup que limpia el timer (higiene de desmontaje).
