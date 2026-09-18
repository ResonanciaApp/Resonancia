---
name: Portada de Sabiduría diaria
description: Dirección visual y temporal confirmada para la pantalla inicial móvil de Sabiduría diaria.
---

La portada móvil es una composición minimalista sobre una imagen fullscreen: volver y título transparentes arriba, siete miniaturas, fecha y frase centradas, CTA y acciones circulares de editar/compartir abajo. No lleva barra opaca ni acceso a notas en el encabezado.

La franja temporal es una ventana fija de los últimos siete días, con hoy siempre como última tarjeta y selección inicial. No se muestran días futuros ni controles para avanzar o retroceder semanas.

Las miniaturas son verticales de 31×47 px, se distribuyen entre los márgenes laterales de 18 px y usan un overlay reducido para conservar la imagen visible. La seleccionada no lleva borde blanco: un punto verde con transición de opacidad sigue la selección. Al deslizar, solo se mueve la imagen; fecha, frase y CTA quedan fijos, hacen fade out y reaparecen con el contenido nuevo. La imagen principal usa exactamente el overlay editorial, sin una capa oscura común adicional.

**Why:** El referente aprobado prioriza una experiencia diaria acotada y contemplativa, no un calendario o historial navegable.

**How to apply:** Conservar estas restricciones al modificar la portada. El detalle, Favoritos y el índice de notas pueden seguir permitiendo recuperar contenido pasado por sus accesos específicos.