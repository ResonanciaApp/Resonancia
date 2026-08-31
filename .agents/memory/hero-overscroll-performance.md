---
name: Overscroll del hero sin lag
description: Patrón para cubrir el backdrop durante un tirón sin degradar el compositor mientras el hero está en reposo.
---

La ampliación extrema de overscroll debe vivir en una capa dedicada que no participe en transformaciones continuas como la respiración. Su opacidad y escala deben derivarse directamente del valor nativo de scroll.

**Why:** Mantener una transformación con un rango máximo grande conectada a una imagen que anima continuamente puede producir lag progresivo de GPU aun cuando el overscroll sea cero. Montar la capa mediante estado de React evitó el lag, pero respondió tarde porque el scroll nativo podía adelantarse varios frames al hilo JS.

**How to apply:** Deja respiración y autoplay en la capa normal. Usa una copia dedicada que permanezca inmóvil e invisible en reposo, sin conectarla a esas animaciones. Deriva opacidad, desplazamiento y escala solo del scroll con driver nativo; no uses estado de React para detectar el inicio del tirón. Limita siempre opacidades derivadas a 0–1.