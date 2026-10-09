---
name: Fondo de tabs no seleccionados
description: Regla visual común para tabs de contenido y filtros en todos los temas.
---

Todos los tabs de contenido no seleccionados usan negro al 16 % (`rgba(0,0,0,0.16)`) en todos los temas. Esta regla incluye categorías principales, pantallas internas y filtros equivalentes de otras superficies.

**Why:** El usuario pidió unificar todos los tabs no seleccionados al 16 % para todos los temas, no solo Cloudy. Sustituye las reglas anteriores de fondos coloreados, transparentes o con distinta opacidad.

**How to apply:** Preservar los diseños de los tabs seleccionados, textos, iconos y bordes. No volver a variar el fondo de un tab inactivo según el tema o el scroll del sticky header. La barra inferior de navegación es una superficie distinta; esta regla no autoriza cambiar su diseño.

Excepción explícita: en la pantalla Muro expansivo, los tabs no seleccionados,
incluido Todos, usan negro al 19 % en Cloudy/Natural y al 16 % en Índigo 2/Pleyades.
Los seleccionados conservan su diseño.

**Why:** El usuario pidió distinguir estas opacidades por tema únicamente en esa pantalla, después de la regla general.

**How to apply:** Mantener la excepción acotada al Muro expansivo; no cambiar los tabs del compositor de Perfil ni otras pantallas.

En Muro, los tabs de categoría seleccionados deben verse del mismo color que las píldoras de las cards, sin brillo adicional.

**Why:** El usuario detectó que usar el mismo color y opacidad no daba el mismo resultado visual porque la capa de blur claro iluminaba los tabs.

**How to apply:** No agregar blur claro a esos tabs. Preservar las animaciones y las otras superficies que usan el componente compartido.