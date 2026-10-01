---
name: useStreak hook unificado
description: Reconciliación de la racha local reciente con la respuesta autoritativa del servidor
---
La UI de racha debe consumir el hook unificado. Cuando ya existe respuesta remota, debe reconciliarla con la actividad local: conservar el mayor contador y unir los días semanales activos, en vez de reemplazar ciegamente el estado local.

**Why:** la respuesta remota puede estar atrasada respecto de eventos locales ya registrados; reemplazarla completa hacía que una racha visible de dos días volviera temporalmente a cero.

**How to apply:** toda pantalla y componente de racha importa el hook unificado. No llamar directamente a los helpers de cálculo, excepto el flujo de celebración que necesita reaccionar en tiempo real al último evento local.

Las respuestas remotas de semana deben quedar aisladas por fecha local, aunque la actividad histórica y la racha consecutiva se conserven.

**Why:** Unir los días activos locales con una respuesta remota todavía cacheada del domingo puede marcar falsamente los siete días del lunes siguiente. El rollover local por sí solo no elimina esos flags remotos.

**How to apply:** Cambiar la identidad del caché remoto al cambiar de día, conservando el prefijo de invalidación de la consulta. No limpiar los eventos ni reiniciar los contadores históricos para corregir la semana visible.