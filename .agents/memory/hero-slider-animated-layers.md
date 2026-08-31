---
name: Slider hero sin flash ni lag acumulativo
description: Reglas para sliders con imágenes persistentes, respiración, swipe y overscroll.
---

Las capas de imagen precargadas deben conservar su transformación Animated conectada incluso con opacidad cero. Desconectarla condicionalmente hace que el slide entrante pueda aparecer un frame sin escala durante un swipe manual.

**Why:** El compositor nativo puede mostrar la capa antes de que React conecte nuevamente el nodo de transformación. Además, crear interpolaciones y multiplicaciones en cada render acumula grafos nativos cuando el autoplay cambia el estado periódicamente.

**How to apply:** Crear y memorizar una sola vez el grafo Animated derivado; reutilizarlo en todas las capas persistentes. Para overscroll muy amplio, conservar la curva visible normal y cubrir el tramo extremo combinando escala limitada con traslación, evitando superficies cercanas a 3×.