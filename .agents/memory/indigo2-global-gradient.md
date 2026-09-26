---
name: Fondo global de Índigo 2
description: El fondo visible de Índigo 2 debe mantener sincronizado el color sólido y sus stops temáticos.
---

Índigo 2 debe usar un color uniforme compartido en todos los fondos temáticos, incluido Inicio. Mantener sincronizados el color sólido y todos los stops del tema; aunque algunas superficies rendericen un degradado por compatibilidad, sus stops idénticos hacen que el fondo se vea plano. No añadir excepciones locales.

**Why:** El usuario pidió cambiar Índigo 2 a un color sólido. Cambiar solamente el valor llamado `solid` no alteró el fondo visible, porque la mayoría de pantallas dibujan los stops del tema. El usuario confirmó que seguía igual.

**How to apply:** Tratar la definición del tema como fuente única para fondos de pantalla. Conservar el número de stops para consumidores que acceden a posiciones concretas. Los fondos explícitos de cards, sheets o identidades particulares no se modifican sin solicitud específica.