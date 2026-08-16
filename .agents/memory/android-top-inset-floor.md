---
name: Android top-inset floor
description: Tablets Android reportan insets.top chico → headers comprimidos vs iPhone
---
En tablets Android el `insets.top` de safe-area-context es mucho menor (~24) que en iPhone con notch (~59), y las pantallas se veían "comprimidas arriba" en la APK.

**Regla:** todo `topPad` nativo usa `Math.max(insets.top, 40)` (patrón aplicado en las tabs principales, _layout, BibliotecaScreen, VideoScreen, encuentros).

**Why:** el usuario compara lado a lado tablet vs iPhone y espera el mismo aire superior; el piso 40 no afecta iPhone.

**How to apply:** al crear pantallas nuevas con padding superior basado en insets, usar el mismo piso 40 en native (web mantiene su constante 67/16).
