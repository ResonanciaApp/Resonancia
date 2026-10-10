---
name: Handoff entre Modal nativos
description: Regla para encadenar una hoja modal y una pantalla modal sin solaparlas en iOS
---

Al reemplazar un `Modal` nativo por otro o abrir la galería del teléfono desde él, la nueva ventana debe abrirse únicamente después de que la animación de salida del primero haya terminado, este se haya desmontado y haya pasado un frame.

**Why:** Un timeout con la misma duración nominal de la animación no garantiza que UIKit ya haya descartado el primer presentador; bajo carga, iOS puede rechazar intermitentemente el segundo modal o el selector de fotos del sistema. La intención de cerrar no equivale al fin de una salida en fade.

**How to apply:** La hoja saliente debe emitir un callback de cierre real. El coordinador guarda la intención pendiente y presenta el segundo modal desde ese callback, idealmente en el siguiente `requestAnimationFrame`.

Si una ayuda debe abrirse sobre una hoja que permanece abierta, preferir otra superficie dentro del mismo host `Modal`, no un segundo `Modal` nativo.

**Why:** La ayuda de Tu camino debe cerrarse sin perder el recorrido debajo; compartir el host evita introducir un segundo presentador nativo y su coordinación de cierre.

**How to apply:** El botón Atrás cierra primero la ayuda, y la hoja inferior deja de ser accesible para lectores de pantalla mientras la ayuda está abierta.