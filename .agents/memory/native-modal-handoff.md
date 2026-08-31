---
name: Handoff entre Modal nativos
description: Regla para encadenar una hoja modal y una pantalla modal sin solaparlas en iOS
---

Al reemplazar un `Modal` nativo por otro, el segundo debe abrirse únicamente después de que la animación de salida del primero haya terminado, este se haya desmontado y haya pasado un frame.

**Why:** Un timeout con la misma duración nominal de la animación no garantiza que UIKit ya haya descartado el primer presentador; bajo carga, iOS puede rechazar intermitentemente el segundo modal.

**How to apply:** La hoja saliente debe emitir un callback de cierre real. El coordinador guarda la intención pendiente y presenta el segundo modal desde ese callback, idealmente en el siguiente `requestAnimationFrame`.