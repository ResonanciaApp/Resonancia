---
name: Fondo global de Índigo 2
description: Alcance compartido y referencia visual confirmada para los colores del fondo de Índigo 2.
---

Los buscadores de Descubrir, Sonidos, Dormir y las lupas de categorías (incluidas sus colecciones y temáticas) usan el degradado completo del tema activo, no la selección reducida de otras superficies.

**Why:** El usuario pidió expresamente todos los tonos en Descubrir, Sonidos y Dormir, y el 2026-10-01 amplió esa regla a las lupas de categorías; la regla de cuatro tonos de otras vistas no debe propagarse a estos buscadores.

**How to apply:** Conservar todas las posiciones y la dirección del tema, con el encabezado transparente para no ocultar el comienzo del degradado. No extender este cambio a otros buscadores sin solicitud.

Índigo 2 usa un degradado temático compartido en toda la app. El primer tono también es el color sólido base; el fondo visible NO debe quedar plano. Biblioteca, Descargas, Diario, Notificaciones e Historial usan el degradado completo del tema activo, tanto en rutas como al abrirse desde el menú. El fondo predeterminado del Mezclador de sonidos y sus vistas inmersivas sigue usando cuatro tonos; los fondos personalizados se respetan.

**Why:** Cambiar solo el valor `solid` no altera el fondo visible si la pantalla dibuja los stops del tema. El usuario amplió expresamente el tratamiento completo de los buscadores a estas cinco superficies; esa petición reemplaza su reducción anterior a cuatro tonos, pero no modifica el Mezclador.

**How to apply:** Tratar la definición del tema como fuente única para fondos de pantalla; conservar todos sus colores, posiciones y dirección en las superficies de degradado completo. En Biblioteca, comprobar también el contenedor de su overlay. Los fondos explícitos de cards, formularios y sheets conservan sus reglas propias; no cambiar Perfil ni el Mezclador por esta petición.

Historial estado de ánimo conserva un degradado editorial propio, ligeramente diagonal, independiente del tema global.

**Why:** El usuario eligió una paleta específica para esa ventana después de ajustar por separado la opacidad de las tarjetas de calendario.

**How to apply:** Cambios al tema global no deben reemplazar el fondo de Historial estado de ánimo ni alterar el negro translúcido de sus calendarios.

Los incrementos porcentuales de brillo de Índigo 2 se aplican una sola vez como mezcla con blanco sobre la paleta vigente, manteniendo la estructura del degradado. No afectan acentos, textos, iconos ni otros temas.

**Why:** Es la convención de brillo del proyecto; el usuario pidió un aumento adicional del 2,5 % solo para Índigo 2, no cambiar el brillo del dispositivo ni activar el modo claro.

**How to apply:** Partir de los colores actuales, no reconstruir una paleta histórica. Actualizar conjuntamente stops y color sólido, sin añadir un overlay que aclare el contenido.