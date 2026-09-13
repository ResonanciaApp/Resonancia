---
name: Cards Ambientales en Sonidos
description: Política visual específica para las cards Ambientales de la pestaña Sonidos.
---

Las cards de los carruseles Ambientales de la pantalla Sonidos son la referencia canónica para toda sesión ambiental. Tienen título centrado, primera línea anclada y píldora de categoría alineada con Dormir; no muestran duración, autor ni overlay oscuro. Su superficie usa literalmente los dos últimos stops del degradado del tema activo, sin transformación de brillo, con borde blanco al 25% de 1 px y radio 31.

**Why:** La pestaña Sonidos, las categorías Ambientales, Todos los sonidos y Favoritos llegaron a mantener overrides visuales distintos. El usuario confirmó que Sonidos es la card madre y todas las demás deben permanecer idénticas.

**How to apply:** Cambiar el preset ambiental compartido, nunca añadir overrides de color o brillo por pantalla o carrusel. Los carruseles de Sonidos y sus pantallas por tag deben forzar `cardVariant="ambiental"` para no depender de metadatos remotos inconsistentes. Todos, incluido “Todos los sonidos”, deben usar exactamente la misma superficie.