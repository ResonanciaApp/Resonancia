---
name: Contenido remoto de Descubrir
description: Reglas de caché e identidad para carruseles administrados y mezclas de la comunidad.
---

Los carruseles configurados desde Admin y el Top 5 de mezclas deben conservar la última respuesta válida del servidor cuando la API o la red fallen temporalmente. Una respuesta exitosa —incluso una lista vacía— sigue siendo autoritativa.

El orden de los carruseles de Descubrir también viene de Admin. Un ajuste visual dirigido a una sección concreta debe identificarla por su slug estable, nunca por `index`.

**Why:** convertir cualquier error de red en `[]` hacía que ambos bloques aparecieran y desaparecieran según la disponibilidad puntual de la API. Además, asumir que una sección concreta era la primera hizo que varios ajustes de posición no afectaran al carrusel solicitado cuando cambió el orden remoto.

**How to apply:** usar únicamente datos recibidos del servidor o su última copia persistida. En error, mantener la copia; en respuesta HTTP exitosa, reemplazarla y persistirla, incluyendo el caso vacío. Para estilos excepcionales, comparar el slug de la sección.