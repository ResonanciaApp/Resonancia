---
name: Fondo global de Índigo 2
description: Alcance compartido y referencia visual confirmada para los colores del fondo de Índigo 2.
---

Los buscadores de Descubrir, Sonidos y Dormir usan el degradado completo del tema activo, no la selección reducida de otras superficies.

**Why:** El usuario pidió expresamente todos los tonos en estas tres pantallas; la regla de cuatro tonos de otras vistas no debe propagarse a los buscadores.

**How to apply:** Conservar todas las posiciones y la dirección del tema, con el encabezado transparente para no ocultar el comienzo del degradado. No extender este cambio a otros buscadores sin solicitud.

Índigo 2 usa un degradado temático compartido en toda la app. El primer tono también es el color sólido base; el fondo visible NO debe quedar plano. Biblioteca, Descargas, Diario, Notificaciones e Historial usan el degradado completo del tema activo, tanto en rutas como al abrirse desde el menú. El fondo predeterminado del Mezclador de sonidos y sus vistas inmersivas sigue usando cuatro tonos; los fondos personalizados se respetan.

**Why:** Cambiar solo el valor `solid` no altera el fondo visible si la pantalla dibuja los stops del tema. El usuario amplió expresamente el tratamiento completo de los buscadores a estas cinco superficies; esa petición reemplaza su reducción anterior a cuatro tonos, pero no modifica el Mezclador.

**How to apply:** Tratar la definición del tema como fuente única para fondos de pantalla; conservar todos sus colores, posiciones y dirección en las superficies de degradado completo. En Biblioteca, comprobar también el contenedor de su overlay. Los fondos explícitos de cards, formularios y sheets conservan sus reglas propias; no cambiar Perfil ni el Mezclador por esta petición.

Historial estado de ánimo conserva un degradado editorial propio, ligeramente diagonal, independiente del tema global.

**Why:** El usuario eligió una paleta específica para esa ventana después de ajustar por separado la opacidad de las tarjetas de calendario.

**How to apply:** Cambios al tema global no deben reemplazar el fondo de Historial estado de ánimo ni alterar el negro translúcido de sus calendarios.