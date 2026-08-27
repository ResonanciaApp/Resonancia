---
name: Contenido remoto de Descubrir
description: Regla de caché para carruseles administrados y mezclas de la comunidad ante fallos transitorios de API.
---

Los carruseles configurados desde Admin y el Top 5 de mezclas deben conservar la última respuesta válida del servidor cuando la API o la red fallen temporalmente. Una respuesta exitosa —incluso una lista vacía— sigue siendo autoritativa.

**Why:** convertir cualquier error de red en `[]` hacía que ambos bloques aparecieran y desaparecieran según la disponibilidad puntual de la API. Para los carruseles no se permite activar secciones locales como fallback porque ignoraría la visibilidad definida en Admin.

**How to apply:** usar únicamente datos recibidos del servidor o su última copia persistida. En error, mantener la copia; en respuesta HTTP exitosa, reemplazarla y persistirla, incluyendo el caso vacío.