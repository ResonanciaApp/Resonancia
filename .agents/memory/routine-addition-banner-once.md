---
name: Aviso único al añadir rutina
description: Regla de consumo para la confirmación de actividad añadida entre calendario e Inicio.
---

Una actividad creada desde el calendario muestra “Actividad añadida” allí una sola vez. Al volver a Inicio, el aviso no se repite. Si se crea desde Inicio, Inicio sigue siendo la superficie que lo muestra.

**Why:** Un ref local de Inicio observaba el identificador de la última actividad y repetía una confirmación ya consumida por el calendario. Además, el foco puede volver antes de que el contexto publique ese identificador.

**How to apply:** La transición desde creación debe transportar el ID exacto de la actividad. La primera superficie que anuncia reconoce ese mismo ID en el contexto global; no depender de un booleano ni del valor capturado durante el cambio de foco.