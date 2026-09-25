---
name: Movimiento de Mi muro
description: Distinción deliberada entre el rebote del control de expansión y la entrada del formulario.
---

En Mi muro expansivo, solo la “+” tiene rebote, y es exclusivamente angular: sobrepasa su orientación, cruza de vuelta con menor amplitud y se amortigua gradualmente. Los tabs, el campo de mensajes y los botones entran con fade-in y desplazamiento descendente monótono, sin sobrepasar ni rebotar; el cierre tampoco rebota. La “+” es simétrica cada 90°, así que tres giros perceptibles no requieren tres vueltas físicas completas.

**Why:** El usuario percibió tres vueltas físicas de la “+” como unas diez vueltas rápidas, rechazó el desplazamiento y cambio aparente de tamaño del icono, y señaló que el rebote del formulario al llegar abajo era incorrecto. Una oscilación matemática breve de ~250 ms con cruces menores a 6° se percibió como parada en seco, no como rebote.

**How to apply:** Al ajustar la duración o curvas de esta tarjeta, conservar el centro/tamaño del icono, al menos tres extremos angulares alternos y perceptibles tras el giro, y la entrada suave del contenido; coordinar ambos finales sin trasladar el rebote al formulario. No confiar en amplitudes ínfimas o segmentos demasiado rápidos solo porque la curva matemática oscile.