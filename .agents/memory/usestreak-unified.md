---
name: useStreak hook unificado
description: Reconciliación de la racha local reciente con la respuesta autoritativa del servidor
---
La UI de racha debe consumir el hook unificado. Cuando ya existe respuesta remota, debe reconciliarla con la actividad local: conservar el mayor contador y unir los días semanales activos, en vez de reemplazar ciegamente el estado local.

**Why:** la respuesta remota puede estar atrasada respecto de eventos locales ya registrados; reemplazarla completa hacía que una racha visible de dos días volviera temporalmente a cero.

**How to apply:** toda pantalla y componente de racha importa el hook unificado. No llamar directamente a los helpers de cálculo, excepto el flujo de celebración que necesita reaccionar en tiempo real al último evento local.