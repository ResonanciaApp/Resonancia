---
name: Cards editoriales con tamaño canónico
description: Restricción visual para el tamaño compartido de cards de sesiones editoriales.
---

Las cards editoriales de Dormir, Inicio, categorías, tags y Ambientales deben usar el ancho y el alto absolutos derivados de la card canónica de Música para dormir para el viewport actual. No deben conservar ni escalar desde el ancho anterior de cada carrusel o grid.

**Why:** Al adaptar proporcionalmente el layout aprobado a los anchos locales, varias cards crecieron aunque el pedido era replicar el contenido y mantener el tamaño de Música para dormir.

**How to apply:** Al extender la presentación editorial a otra superficie, ignorar sus overrides históricos de ancho/alto y calcular ambas dimensiones desde la misma fórmula canónica de Música para dormir. Ambientales conserva esas dimensiones aunque oculte autor y duración.