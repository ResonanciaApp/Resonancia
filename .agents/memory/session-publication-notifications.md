---
name: Avisos de nuevas sesiones
description: Reglas durables para preferencias editoriales, publicación, deduplicación y push de sesiones nuevas.
---

Las preferencias de contenido combinan categorías principales con etiquetas internas de “Explora por objetivo”, identificadas por su valor canónico `__other_theme_internal:<slug>__:<label>`. Si ambas coinciden, la etiqueta interna gana para el mensaje.

**Why:** una sesión puede pertenecer simultáneamente a una categoría y a una etiqueta específica; generar dos avisos sería duplicado y perder el valor de la coincidencia más precisa.

**How to apply:** la transición real a publicada y las filas del buzón deben confirmarse en la misma transacción con bloqueo de la sesión. La unicidad es por usuario y sesión. El buzón persistido es la fuente de verdad; el push se envía después como canal adicional.