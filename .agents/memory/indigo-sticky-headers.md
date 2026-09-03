---
name: Sticky headers Índigo
description: Convención visual compartida para headers y tabs que se fijan al hacer scroll en Índigo e Índigo 2.
---

En Índigo e Índigo 2, los sticky headers de las pantallas principales de exploración usan vidrio puro con blur fuerte, sin tinte cromático, sin oscurecimiento negro y sin divisor recto. El extremo inferior debe desvanecerse para evitar un corte horizontal visible.

En Índigo 2, los tabs inactivos pasan de blanco con alpha 0.025 a alpha 0.075 mediante un fade de 300 ms sincronizado con la activación del sticky header, y vuelven a 0.025 al desactivarse. Los tabs seleccionados no cambian. Índigo conserva su fondo propio.

**Why:** Esta dirección fue elegida para que el contenido siga siendo visible bajo el header sin que aparezcan bloques opacos, tintes o líneas que rompan el efecto glass morphing.

**How to apply:** Mantener esta convención en Descubrir, Dormir, Sonidos, categorías, Mis Favoritos, Biblioteca y Perfil, y reutilizarla en nuevas pantallas equivalentes. En Índigo 2, la barra inferior usa el mismo `theme.solid` que Inicio, no negro puro.