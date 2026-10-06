---
name: Control externo del selector de fondos
description: Ubicación deliberada del botón de expansión en el compositor de historias del muro.
---

El botón para ampliar y retraer los fondos debe estar afuera de la grilla, encima y a la derecha, no dentro de su superficie.

Este control no debe desplazar ni achicar el hero por agregar espacio al layout; conservar su geometría anterior tanto al abrir como al retraer la grilla.

**Why:** El usuario corrigió explícitamente esta ubicación: «El botón tenía que estar afuera de la grilla, no adentro». También aclaró que sacar el control no autoriza mover el hero.

**How to apply:** Al rediseñar este compositor, mantener el control como una zona externa al catálogo de imágenes; no volver a incorporarlo como una fila dentro del área de la grilla.
