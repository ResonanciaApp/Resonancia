---
name: Fondo global de Índigo 2
description: Alcance compartido y referencia visual confirmada para los colores del fondo de Índigo 2.
---

Índigo 2 usa un degradado temático compartido en toda la app. El primer tono también es el color sólido base; el fondo visible NO debe quedar plano. Biblioteca, Descargas, Diario, Notificaciones e Historial usan los cuatro primeros tonos del tema. Los tonos elegidos se distribuyen a lo largo de cada pantalla. El fondo predeterminado del Mezclador de sonidos y sus vistas inmersivas también usan cuatro tonos; los fondos personalizados se respetan.

**Why:** Cambiar solo el valor `solid` no alteró el fondo visible, porque la mayoría de pantallas dibujan los stops del tema. El usuario ha enviado referencias con secuencias de colores distintas; cuando los porcentajes están recortados o no son legibles, se distribuyen los tonos uniformemente de arriba abajo, sin inventar posiciones. También pidió expresamente que las cinco superficies indicadas usaran los cuatro primeros tonos.

**How to apply:** Tratar la definición del tema como fuente única para fondos de pantalla; si cambia el número de tonos, actualizar también las posiciones en igual cantidad. Aplicar el recorte específico de cada superficie sin truncar el tema global ni cambiar Perfil. Al cambiar el fondo predeterminado del Mezclador, revisar también sus vistas inmersivas: tienen una definición propia y pueden conservar tonos antiguos. Los fondos explícitos de cards, sheets o identidades particulares no se modifican sin solicitud específica.

Historial estado de ánimo conserva un degradado editorial propio, ligeramente diagonal, independiente del tema global.

**Why:** El usuario eligió una paleta específica para esa ventana después de ajustar por separado la opacidad de las tarjetas de calendario.

**How to apply:** Cambios al tema global no deben reemplazar el fondo de Historial estado de ánimo ni alterar el negro translúcido de sus calendarios.