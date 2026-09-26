---
name: Fondo global de Índigo 2
description: Alcance compartido y referencia visual confirmada para los colores del fondo de Índigo 2.
---

Índigo 2 usa un degradado temático de cuatro tonos oscuros en 0%, 25%, 47% y 72%. El primer tono también es el color sólido base; el fondo visible NO debe quedar plano. No añadir excepciones locales.

**Why:** Cambiar solo el valor `solid` no alteró el fondo visible, porque la mayoría de pantallas dibujan los stops del tema. Después de probar un fondo plano, el usuario aportó una referencia visual precisa de cuatro tonos y sus posiciones. Una imagen posterior cambió los tonos sin mostrar posiciones, así que se conservaron las posiciones originales.

**How to apply:** Tratar la definición del tema como fuente única para fondos de pantalla, mantener sus cuatro stops y posiciones. Los fondos explícitos de cards, sheets o identidades particulares no se modifican sin solicitud específica.