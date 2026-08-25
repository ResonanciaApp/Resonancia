---
name: Android mixed pill radii
description: Cómo mantener radios de esquina precisos en pills parcialmente cápsula sobre React Native Android.
---

En una pill con esquinas externas tipo cápsula y esquinas internas pequeñas, no usar `999` como radio de la cápsula. Usar la mitad exacta de la altura de la pill (por ejemplo, 45 px de alto → 22.5 px de radio) y declarar cada esquina.

**Why:** El renderizador nativo puede normalizar una esquina extrema junto a radios pequeños en la misma superficie bordeada, haciendo que los radios de 10 px se vean más cerrados o se pierdan visualmente.

**How to apply:** En una fila de pills unidas visualmente, calcular el radio exterior desde la altura y usarlo solo en las esquinas de extremo; mantener `10` explícito en las esquinas internas. Evitar mezclar `borderRadius` shorthand con los radios por esquina en el mismo estilo.