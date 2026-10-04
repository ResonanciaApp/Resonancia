---
name: Velocidad de apertura de paneles
description: Geometría que debe revisarse al igualar aperturas de ventanas inferiores.
---

Al igualar la apertura de dos paneles, comparar también desde dónde entra cada uno: usar la altura real del contenido, no el máximo permitido por la pantalla.

**Why:** La ayuda de Puntos creatividad ya compartía el resorte y fade del temporizador Ambiental, pero partía desde la altura máxima de pantalla en vez de desde debajo de su propio contenido. Ese recorrido invisible extra puede cambiar la entrada percibida aunque los parámetros coincidan.

**How to apply:** Esperar una medida real del panel antes de empezar su primera entrada; conservarlo fuera de pantalla mientras se mide y cancelar cualquier apertura pendiente al cerrar. Comparar solo la apertura si el usuario no pidió cambiar el cierre.