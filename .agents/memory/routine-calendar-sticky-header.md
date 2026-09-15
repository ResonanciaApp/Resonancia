---
name: Header del calendario de rutina
description: Convención visual y estructural del encabezado en la vista expansiva de Mi rutina.
---

En el calendario expansivo de Mi rutina, el encabezado, la fila semanal y su línea divisora forman un único bloque sticky. El contenido desplazable comienza debajo de esa línea.

**Why:** El usuario necesita conservar siempre visibles la fecha seleccionada y la navegación semanal mientras consulta actividades.

**How to apply:** Mantener 16 px de margen lateral, igual que Inicio. Los círculos de días inactivos usan negro al 28%. El sticky replica el fondo a escala de viewport y cubre también el safe area superior; no incluye filtro “Mostrar todo/Solo completadas”.

El botón “Borrar todo” elimina visual y persistentemente las ocurrencias completadas de la fecha seleccionada. Además, retira esas actividades recurrentes desde esa fecha para que no vuelvan en días futuros; las rutinas no borradas continúan normalmente.

La fila semanal navega con gesto horizontal: deslizar a la derecha muestra la semana anterior y deslizar a la izquierda avanza hacia la actual, sin permitir semanas posteriores a la actual. Conserva el día relativo; al cambiar el día real, solo avanza automáticamente si el usuario estaba siguiendo “hoy”.