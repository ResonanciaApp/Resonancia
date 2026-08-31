---
name: Overscroll del hero sin lag
description: Patrón para cubrir el backdrop durante un tirón sin degradar el compositor mientras el hero está en reposo.
---

La ampliación extrema de overscroll debe vivir en una capa temporal que se monte solo mientras el desplazamiento sea negativo. La capa normal del hero conserva únicamente sus transformaciones continuas pequeñas, como la respiración.

**Why:** Mantener una transformación con un rango máximo grande conectada a una imagen que anima continuamente puede producir lag progresivo de GPU aun cuando el valor actual de overscroll sea cero. Ocultar capas con opacidad o reducir el máximo solo mitigó y retrasó el problema.

**How to apply:** Para héroes con imágenes persistentes, deja la respiración y el autoplay en la capa normal. Al entrar en overscroll, superpone una copia visual temporal con la escala de cobertura; al volver al origen, desmóntala por completo. Cambia el estado solo al cruzar el umbral, nunca por frame.