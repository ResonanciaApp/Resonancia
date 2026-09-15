---
name: Sticky headers Índigo
description: Convención visual compartida para headers y tabs que se fijan al hacer scroll en Índigo e Índigo 2.
---

En Índigo e Índigo 2, los sticky headers de las pantallas principales de exploración usan vidrio puro con blur fuerte, sin tinte cromático, sin oscurecimiento negro y sin divisor recto. El extremo inferior debe desvanecerse para evitar un corte horizontal visible.

En Índigo 2, los tabs inactivos pasan de blanco con alpha 0.025 a alpha 0.075 mediante un fade de 300 ms sincronizado con la activación del sticky header, y vuelven a 0.025 al desactivarse. Los tabs seleccionados no cambian. Índigo conserva su fondo propio.

**Why:** Esta dirección fue elegida para que el contenido siga siendo visible bajo el header sin que aparezcan bloques opacos, tintes o líneas que rompan el efecto glass morphing.

**How to apply:** Mantener esta convención en Descubrir, Dormir, Sonidos, categorías, Mis Favoritos, Biblioteca y Perfil, y reutilizarla en nuevas pantallas equivalentes. En Índigo 2, la barra inferior usa el mismo `theme.solid` que Inicio, no negro puro.

En las páginas principales de categorías, la fila de tabs del sticky header mantiene 2 px de separación respecto del fondo circular de la lupa. La medida es común a Música, Meditaciones, Sonoterapia y categorías dinámicas.

Desde el final de las píldoras del sticky header hasta su borde inferior se reservan 6 px.

Dormir y Sonidos usan esos mismos 6 px bajo sus píldoras sticky; Descubrir los aplica bajo la barra de búsqueda, que es su último control sticky. Categorías y pantallas internas siguen la misma medida.

Todos esos sticky headers terminan con un borde inferior blanco de 1 px a opacidad 0,07.

“Mis favoritos” aplica la misma terminación bajo sus tabs embebidos: 6 px y borde blanco de 1 px a opacidad 0,07.

Comunidad y Perfil también terminan su sticky header con ese borde; la lupa y el engranaje quedan visualmente a 6 px de la línea inferior.

Biblioteca y Mezclador de sonidos mantienen 6 px entre sus tabs y el borde inferior blanco de 1 px a opacidad 0,07.

En el Mezclador, ese borde no es permanente: hace fade in al desplazar el catálogo y fade out al volver arriba.

En las pantallas internas de Sonidos, el borde bajo los filtros sigue el mismo comportamiento de fade según el scroll de la grilla.