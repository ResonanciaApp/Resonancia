---
name: Categorías de avatares de Perfil
description: Pertenencia editorial múltiple confirmada por el usuario.
---

Las categorías de avatares de Perfil no son exclusivas: un mismo avatar puede pertenecer a varias a la vez.

**Why:** El usuario eligió expresamente «Varias categorías» frente a una asignación única.

**How to apply:** Al asignar o retirar una categoría, preservar las otras pertenencias. Los filtros muestran el mismo avatar dentro de cualquiera de sus categorías, sin duplicarlo en la vista general.

El orden editorial elegido en Admin debe ser compartido con la app, también cuando se genera aleatoriamente; no debe volver a barajarse por usuario o al abrir el selector.

**Why:** El usuario pidió que los cambios de orden del Admin se reflejen en la app. Un sorteo independiente en cada cliente rompería esa correspondencia.

**How to apply:** Tratar Aleatorio e Intercalado como formas de preparar un orden para guardar, conservando la posibilidad de ajustarlo manualmente.

La ventana móvil de Portada de avatares se cierra únicamente al deslizarla hacia abajo, no al tocar el fondo ni espacios vacíos.

**Why:** El usuario retiró expresamente el cierre por tacto para evitar cierres accidentales mientras explora o filtra avatares.

**How to apply:** Mantener el gesto descendente coordinado con el scroll: desde la cabecera siempre, y desde la grilla solo cuando está en el inicio. Un gesto corto vuelve suavemente a su posición.

Las pruebas de callbacks aislados no demuestran que el dispositivo reconozca el gesto de cierre de Portada.

**Why:** La lógica de cierre pasaba las pruebas, pero el usuario seguía atrapado en la ventana porque el arrastre real no se reconocía.

**How to apply:** Distinguir siempre lógica y compilación de verificación interactiva nativa. No afirmar que el cierre funciona en iPhone ni que es fluido sin haber probado el arrastre real.
