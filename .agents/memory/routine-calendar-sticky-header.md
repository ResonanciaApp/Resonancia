---
name: Header del calendario de rutina
description: Convención visual y estructural del encabezado en la vista expansiva de Mi rutina.
---

En el calendario expansivo de Mi rutina, el encabezado, la fila semanal y su línea divisora forman un único bloque sticky. El contenido desplazable comienza debajo de esa línea.

**Why:** El usuario necesita conservar siempre visibles la fecha seleccionada y la navegación semanal mientras consulta actividades.

**How to apply:** Mantener 16 px de margen lateral, igual que Inicio. Los círculos de días inactivos usan negro al 28%. El sticky replica el fondo completo de la pantalla a escala de viewport y lo recorta, para cubrir el contenido sin verse como una franja sólida.