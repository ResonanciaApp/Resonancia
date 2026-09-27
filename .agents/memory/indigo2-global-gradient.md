---
name: Fondo global de Índigo 2
description: Alcance compartido y referencia visual confirmada para los colores del fondo de Índigo 2.
---

Índigo 2 usa un degradado temático compartido en toda la app. El primer tono también es el color sólido base; el fondo visible NO debe quedar plano. No añadir excepciones locales.

**Why:** Cambiar solo el valor `solid` no alteró el fondo visible, porque la mayoría de pantallas dibujan los stops del tema. Tras varias referencias, el usuario envió una secuencia de seis tonos sin porcentajes visibles; a diferencia de la referencia anterior de cuatro tonos, esta necesita posiciones nuevas. Se distribuyen uniformemente de arriba abajo hasta que haya porcentajes explícitos.

**How to apply:** Tratar la definición del tema como fuente única para fondos de pantalla; si cambia el número de tonos, actualizar también las posiciones en igual cantidad. Los fondos explícitos de cards, sheets o identidades particulares no se modifican sin solicitud específica.

Dormir es una excepción explícita al fondo global: su pantalla tiene un degradado propio de tres tonos, independiente del tema visual activo.

**Why:** El usuario pidió que la ventana abierta desde la luna de Dormir mantenga ese degradado concreto, no que cambie el resto de la app.

**How to apply:** Al modificar el tema global, conservar el fondo propio de Dormir; si se cambia su paleta, mantener alineados fondo, cabecera fija y vista de todas las sesiones.