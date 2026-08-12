---
name: FlatList ListHeaderComponent remount
description: Header pasado como componente (useCallback con deps cambiantes) remonta el header y resetea carruseles internos
---

Regla: `ListHeaderComponent` debe recibir un ELEMENTO JSX (`listHeaderElement`) o un componente de identidad estable, nunca un `useCallback` cuyas deps cambian con el scroll (p.ej. `activeIndex` de los dots).

**Why:** en Comunidad (encuentros.tsx) el carrusel "Encuentros Resonadores" se devolvía a la primera card en cada swipe: cambiar `activeIndex` recreaba la función del header → React lo trataba como tipo nuevo → remount → FlatList horizontal perdía el scroll.

**How to apply:** si un FlatList/ScrollView vive dentro de un header/footer de otra lista, pasa el header como elemento; el estado que cambia con la interacción (dots, contadores) puede vivir en el elemento sin problema.
