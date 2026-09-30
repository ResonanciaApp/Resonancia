---
name: Porcentajes de color del tema
description: Convención para derivar colores cuando se piden incrementos porcentuales de saturación y contraste.
---

Para ajustes porcentuales sobre una paleta hex, tratar la saturación como un factor relativo en HSL (por ejemplo, 1,5 % más = saturación × 1,015). Después aplicar el contraste por canal RGB alrededor del punto medio normalizado 0,5 (por ejemplo, 2 % más = `(canal − 0,5) × 1,02 + 0,5`), limitar al rango válido y redondear una vez al convertir a hex.

**Why:** «Más saturado» y «más contraste» admiten varias interpretaciones; esta convención hace reproducibles los cambios sutiles y evita acumular errores por redondeos intermedios.

**How to apply:** Úsala cuando se pidan porcentajes sobre tonos concretos sin otra definición. Si el usuario pide puntos porcentuales, contraste entre stops o un efecto visual distinto, priorizar esa indicación.