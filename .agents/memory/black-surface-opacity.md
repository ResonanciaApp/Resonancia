---
name: Superficies negras translúcidas
description: Intención editorial del ajuste global de opacidad de fondos negros, distinta de bordes y excepciones locales.
---

Los fondos negros translúcidos de la app móvil que usaban 22 % o 28 % deben mantenerse en 16 %, incluidos controles, cards, tabs, píldoras, paneles y fondos Ambientales, salvo la excepción posterior de Cloudy. Esto no exige uniformar todas las superficies: los fondos de otros colores y otras opacidades conservan su valor propio.

**Why:** Tras revisar el inventario general y luego tabs de Dormir/Sonidos/categorías y cards Ambientales, el usuario pidió llevar todos los fondos negros al 22 % y 28 % a «0,16 opacidad». Esto reemplaza la dirección anterior de 28 % a 22 %. Bordes y sombras no forman parte del cambio.

**How to apply:** En nuevas superficies negras compartidas, preferir 16 % si sustituyen ese tratamiento anterior. Los controles circulares genéricos tienen su regla posterior: fondo negro al 16 % sin borde, incluso si antes eran blancos o temáticos. Conservar sombras, bordes de otras superficies y los tabs específicos al 21 %.

Excepciones explícitas: el fondo del banner “Conoce a los Resonadores” de Descubrir y el de “Mezclador de sonidos” de Sonidos usan negro al 28 %.

**Why:** El usuario pidió 0,28 para Resonadores después del ajuste global y posteriormente igualó el Mezclador a esa opacidad; son excepciones intencionales, no regresiones.

**How to apply:** Conservar su borde, texto, imagen, acción y opacidad de pulsación. Cambiar solo el fondo; no volver a convertirlo al 16 % con una limpieza global.

Los fondos de las secciones de Perfil usan negro al 16 % y deben conservarlo fuera de Cloudy.

**Why:** El usuario pidió explícitamente «En perfil, a los fondos de la seccion ponles negro con 0,16 opacidad».

**How to apply:** Aplicar a las superficies de las secciones, incluido Intención y Mi muro expansivo; no cambiar sus controles, píldoras, bordes ni fondos de otras pantallas cuando el componente sea compartido.

Solo en Cloudy, todos los fondos negros del 16 % pasan al 19 %: tabs, controles circulares, cards, Mi rutina expansiva, Ambientales y otras superficies. Cloudy 2 y los demás temas conservan el 16 %; los banners al 28 % y cualquier otra opacidad permanecen iguales.

**Why:** El usuario pidió el ajuste para toda la app, limitado explícitamente a Cloudy y a los fondos que ya eran negro al 16 %.

**How to apply:** Resolver el cambio al renderizar y suscribir también los estilos estáticos a cambios de tema, sin mutar definiciones compartidas ni remontar pantallas. No aumentar bordes, sombras, SVG fills, gradientes ni la opacidad total del componente. La compilación compartida de superficies debe seguir aplicándose también a nuevos componentes para evitar huecos.