---
name: Tema visual único y escenas sonoras
description: Cómo mantener Universo y Luz/Noche separados de la selección de escenas de audio.
---

El tema visual principal de la app móvil es Universo (ID técnico `tibet`), con su degradado de cuatro tonos original saturado un 5 % adicional. La elección de una escena sonora no debe cambiar el aspecto visual. Luz y Noche solo alteran los colores de fondo del tema: Noche conserva los tonos originales y Luz los mezcla una única vez con blanco al 3,5 %. La preferencia visual se conserva localmente y se resuelve antes de mostrar la app.

**Why:** El usuario pidió retirar los otros temas visuales, pero conservar las escenas de audio como funcionalidad independiente. Después sustituyó Índigo 2 como tema principal por Universo; cambiar la escena de audio no debe cambiar el fondo. La implementación previa de «modo brillante» combinaba cambios de saturación/luminosidad con un overlay adicional; acumular esos efectos no representaba un único aumento controlado. Posteriormente pidió reducir el aclarado de Luz de 7 % a 3,5 %.

**How to apply:** Si se añade una pantalla u hoja temática, consumir la paleta visual compartida para su fondo; no inferir el tema desde la escena de audio ni volver a introducir selectores de temas. No aclarar textos, iconos ni imágenes editoriales mediante un overlay de pantalla completa. Los fondos de marca explícitos son excepciones editoriales, no otros temas seleccionables.