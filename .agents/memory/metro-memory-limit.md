---
name: Memoria de Metro en RESONANCE
description: Límite de heap necesario para que Metro compile simultáneamente los bundles web e iOS.
---

El workflow móvil debe conservar un heap de Node de al menos 6 GB durante el desarrollo.

**Why:** Un rebuild limpio compiló web e iOS en paralelo y Metro agotó exactamente el límite anterior de 4 GB, terminando con `Ineffective mark-compacts near heap limit` y dejando el artifact en estado FAILED. El contenedor dispone de memoria suficiente para 6 GB.

**How to apply:** No reducir el límite de heap del comando de desarrollo a 4 GB. Si vuelve a aparecer un OOM, confirmar primero el consumo y la memoria disponible antes de aumentarlo otra vez.